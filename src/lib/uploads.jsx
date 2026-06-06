import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {uploadWithProgress} from './upload.js';

// A global upload manager: uploads are started here (at the app root), not inside a block, so
// they keep running and keep showing progress even as you navigate around the editor. The
// result is handed back to whoever started it via `onComplete`.
const UploadContext = createContext({uploads: [], start: () => {}, dismiss: () => {}});

export const useUploads = () => useContext(UploadContext);

export function UploadProvider({children}) {
    const [uploads, setUploads] = useState([]); // {id, blockId, name, progress, status, error}
    const controllers = useRef({});
    const uploadsRef = useRef(uploads);
    uploadsRef.current = uploads;

    const update = (id, patch) => setUploads(u => u.map(x => (x.id === id ? {...x, ...patch} : x)));
    const remove = id => setUploads(u => u.filter(x => x.id !== id));

    const start = useCallback((file, {url = '/api/admin/upload-video', blockId, onComplete} = {}) => {
        const id = `up-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        // Re-uploading to the same block replaces the in-flight one (cancel it first).
        if (blockId) {
            for (const prev of uploadsRef.current) {
                if (prev.blockId === blockId && prev.status === 'uploading') controllers.current[prev.id]?.abort();
            }
        }
        // `blockId` lets a Video block show this upload's progress inline (and find it again
        // after a remount), independent of the global dock.
        setUploads(u => [...u, {id, blockId, name: file.name || 'video', progress: 0, status: 'uploading'}]);
        const controller = new AbortController();
        controllers.current[id] = controller;
        uploadWithProgress(url, file, {onProgress: p => update(id, {progress: p}), signal: controller.signal})
            .then(res => {
                update(id, {status: 'done', progress: 1});
                try {
                    onComplete?.(res);
                } catch {
                    // a stale target is fine — the video is still in the library
                }
                setTimeout(() => remove(id), 5000);
            })
            .catch(err => {
                if (controller.signal.aborted) return remove(id); // cancelled: no error chip
                update(id, {status: 'error', error: err?.message || 'Upload failed'});
                setTimeout(() => remove(id), 10000);
            })
            .finally(() => {
                delete controllers.current[id];
            });
        return id;
    }, []);

    const dismiss = useCallback(id => {
        controllers.current[id]?.abort();
        remove(id);
    }, []);

    // Warn before a reload / full navigation that would abort an in-flight transfer.
    useEffect(() => {
        if (!uploads.some(u => u.status === 'uploading')) return;
        const warn = e => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [uploads]);

    return <UploadContext.Provider value={{uploads, start, dismiss}}>
        {children}
        <UploadDock uploads={uploads} onDismiss={dismiss}/>
    </UploadContext.Provider>;
}

function UploadDock({uploads, onDismiss}) {
    if (!uploads.length) return null;
    return <div className="upload-dock">
        {uploads.map(u => {
            const pct = Math.round((u.progress || 0) * 100);
            return <div key={u.id} className={`upload-chip ${u.status}`}>
                <div className="upload-chip-head">
                    <span className="upload-chip-name" title={u.name}>{u.name}</span>
                    <button type="button" className="upload-chip-x"
                            title={u.status === 'uploading' ? 'Cancel upload' : 'Dismiss'}
                            onClick={() => onDismiss(u.id)}>×</button>
                </div>
                {u.status === 'uploading' &&
                    <div className="upload-bar"><div className="upload-bar-fill" style={{width: `${pct}%`}}/></div>}
                <span className="upload-chip-status">
                    {u.status === 'uploading' ? `Uploading ${pct}%`
                        : u.status === 'done' ? 'Uploaded — optimizing…'
                            : (u.error || 'Upload failed')}
                </span>
            </div>;
        })}
    </div>;
}
