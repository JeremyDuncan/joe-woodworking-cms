import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Check, Film, Pencil, Trash2, X} from 'lucide-react';
import {confirmDialog, notify} from '../lib/dialog.jsx';
import {SectionHeader} from './SectionHeader.jsx';

function fmtSize(bytes) {
    if (!bytes) return '—';
    const mb = bytes / 1048576;
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function VideoRow({v, onRename, onDelete}) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(v.name || '');
    useEffect(() => setName(v.name || ''), [v.name]);

    const save = () => {
        const n = name.trim();
        if (n && n !== v.name) onRename(v.key, n);
        setEditing(false);
    };
    const pct = Math.round((v.progress || 0) * 100);

    return <div className="video-row">
        <video className="video-row-thumb" src={v.url} muted controls preload="metadata"/>
        <div className="video-row-main">
            {editing
                ? <div className="video-name-edit">
                    <input autoFocus value={name} onChange={e => setName(e.target.value)}
                           onKeyDown={e => {
                               if (e.key === 'Enter') save();
                               if (e.key === 'Escape') setEditing(false);
                           }}/>
                    <button type="button" className="vid-icon-btn" title="Save" onClick={save}><Check size={15}/></button>
                    <button type="button" className="vid-icon-btn" title="Cancel"
                            onClick={() => setEditing(false)}><X size={15}/></button>
                </div>
                : <div className="video-name">
                    <span className="video-name-text">{v.name || v.originalName || 'Untitled'}</span>
                    <button type="button" className="vid-icon-btn" title="Rename"
                            onClick={() => setEditing(true)}><Pencil size={14}/></button>
                </div>}
            <div className="video-meta">
                <span className={`video-status ${v.status}`}>
                    {v.status === 'processing' ? `Optimizing ${pct}%` : 'Ready'}
                </span>
                <span>{fmtSize(v.size)}</span>
                <span className="video-addr">{v.url}</span>
            </div>
            {v.status === 'processing' &&
                <div className="upload-bar"><div className="upload-bar-fill" style={{width: `${pct}%`}}/></div>}
        </div>
        <button type="button" className="vid-icon-btn danger" title="Delete video"
                onClick={() => onDelete(v)}><Trash2 size={15}/></button>
    </div>;
}

export function VideoLibrary() {
    const [videos, setVideos] = useState(null);
    // Keys removed optimistically — filtered out of refetches until the server catches up, so a
    // background poll can't briefly re-add a row you just deleted.
    const pendingDeletes = useRef(new Set());
    const load = useCallback(() => fetch('/api/admin/videos', {cache: 'no-store'}).then(r => r.json())
        .then(d => setVideos((Array.isArray(d) ? d : []).filter(v => !pendingDeletes.current.has(v.key))))
        .catch(() => setVideos(vs => vs ?? [])), []);

    useEffect(() => {
        load();
    }, [load]);
    // Refresh while anything is still optimizing so progress + final size update live.
    useEffect(() => {
        if (!(videos || []).some(v => v.status === 'processing')) return;
        const t = setInterval(load, 2500);
        return () => clearInterval(t);
    }, [videos, load]);

    async function rename(key, name) {
        const r = await fetch(`/api/admin/videos/${key}`, {
            method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name})
        });
        if (r.ok) setVideos(vs => (vs || []).map(x => x.key === key ? {...x, name} : x));
        else notify('Could not rename the video.', 'error');
    }

    async function remove(v) {
        const ok = await confirmDialog(`Delete “${v.name || 'this video'}”? Any block using it will lose its video.`,
            {danger: true, okLabel: 'Delete'});
        if (!ok) return;
        // Remove it instantly — don't wait on the (possibly slow) server response.
        pendingDeletes.current.add(v.key);
        setVideos(vs => (vs || []).filter(x => x.key !== v.key));
        try {
            const r = await fetch(`/api/admin/videos/${v.key}`, {method: 'DELETE'});
            if (!r.ok && r.status !== 404) throw new Error('delete failed'); // 404 = already gone, fine
        } catch {
            // Real failure — put it back so it can be retried.
            pendingDeletes.current.delete(v.key);
            notify('Could not delete the video.', 'error');
            load();
        }
    }

    if (videos === null) return <p className="ph-empty">Loading…</p>;
    return <div className="video-library">
        <SectionHeader icon={Film} title="Video">
            Every video uploaded to a Video block. Rename them to stay organized; the status shows background
            optimization progress, and you can reuse any of these from a Video block's library picker.
        </SectionHeader>
        {videos.length === 0
            ? <p className="ph-empty">No videos yet — add a Video block to a page and upload one.</p>
            : <div className="video-list">{videos.map(v => <VideoRow key={v.key} v={v} onRename={rename} onDelete={remove}/>)}</div>}
    </div>;
}
