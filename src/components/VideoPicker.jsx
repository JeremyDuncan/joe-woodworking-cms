import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {Film, Search} from 'lucide-react';

// A panel of already-uploaded videos to pick from (opened by the Video block's library icon).
export function VideoPicker({current, onPick, onClose}) {
    const [videos, setVideos] = useState(null);
    const [q, setQ] = useState('');

    useEffect(() => {
        fetch('/api/admin/videos', {cache: 'no-store'}).then(r => r.json())
            .then(d => setVideos(Array.isArray(d) ? d : []))
            .catch(() => setVideos([]));
    }, []);

    const term = q.trim().toLowerCase();
    const list = (videos || []).filter(v => !term || `${v.name || ''} ${v.originalName || ''}`.toLowerCase().includes(term));

    return createPortal(
        <div className="dialog-backdrop" onMouseDown={onClose}>
            <div className="dialog video-picker" onMouseDown={e => e.stopPropagation()}>
                <div className="theme-panel-head">
                    <strong><Film size={18}/> Choose a video</strong>
                    <button type="button" className="theme-close" onClick={onClose}>×</button>
                </div>
                <div className="sitemap-search">
                    <Search size={15}/>
                    <input autoFocus type="text" placeholder="Search videos…" value={q}
                           onChange={e => setQ(e.target.value)}/>
                    {q && <button type="button" className="sitemap-search-clear" onClick={() => setQ('')}>×</button>}
                </div>
                <div className="video-picker-grid">
                    {videos === null && <p className="sitemap-empty">Loading…</p>}
                    {videos && list.length === 0 &&
                        <p className="sitemap-empty">No videos found — upload one from a Video block first.</p>}
                    {list.map(v => {
                        const pct = Math.round((v.progress || 0) * 100);
                        return <button key={v.key} type="button"
                                       className={`video-pick${v.url === current ? ' current' : ''}`}
                                       onClick={() => onPick(v.url)}>
                            <video className="video-pick-thumb" src={v.url} muted preload="metadata"/>
                            <span className="video-pick-name">{v.name || v.originalName || 'Untitled'}</span>
                            <span className={`video-status ${v.status}`}>
                                {v.status === 'processing' ? `Optimizing ${pct}%` : 'Ready'}
                            </span>
                        </button>;
                    })}
                </div>
            </div>
        </div>, document.body);
}
