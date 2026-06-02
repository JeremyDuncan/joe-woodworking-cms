import React, {useMemo, useState} from 'react';
import {Edit3, Trash2} from 'lucide-react';
import {formatDate} from '../lib/format.js';
import {MediaPreview} from '../components/MediaPreview.jsx';
import {confirmDialog, notify} from '../lib/dialog.jsx';

export function ItemList({items, reload, startEdit}) {
    const [query, setQuery] = useState(''), [sortMode, setSortMode] = useState('newest');
    const visible = useMemo(() => items.filter(w => `${w.title} ${w.description} ${w.price}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => {
        if (sortMode === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortMode === 'title') return String(a.title || '').localeCompare(String(b.title || ''));
        if (sortMode === 'updated') return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }), [items, query, sortMode]);
    return <section className="admin-list">
        <div className="admin-list-toolbar">
            <div><h2>Current Items</h2><p>{visible.length} of {items.length} shown</p></div>
            <input placeholder="Search Items" value={query} onChange={e => setQuery(e.target.value)}/><label>Sort
            by <select value={sortMode} onChange={e => setSortMode(e.target.value)}>
                <option value="newest">Newest added</option>
                <option value="oldest">Oldest added</option>
                <option value="updated">Recently updated</option>
                <option value="title">Title A–Z</option>
            </select></label></div>
        <div className="item-carousel-shell">
            <div className="item-carousel-list">{visible.map((w, i) => <article key={w.id} className="item-list-row">
                <div className="item-list-index">{String(i + 1).padStart(2, '0')}</div>
                <div className="item-list-thumb"><MediaPreview media={w.media} compact/></div>
                <div className="item-list-copy"><h3>{w.title}</h3><p>{w.description}</p>
                    <div className="item-list-meta">
                        <span>{w.price || 'No price'}</span><span>Added {formatDate(w.createdAt)}</span><span>Updated {formatDate(w.updatedAt)}</span><span>{w.media?.length || 0} media</span>
                    </div>
                </div>
                <div className="admin-actions">
                    <button type="button" onClick={() => startEdit(w)} className="button button-ghost"><Edit3
                        size={16}/> Edit
                    </button>
                    <button type="button" onClick={async () => {
                        if (!(await confirmDialog('Delete this item?', {danger: true, okLabel: 'Delete'}))) return;
                        try {
                            const r = await fetch('/api/admin/items/' + w.id, {method: 'DELETE'});
                            if (!r.ok) {
                                const j = await r.json().catch(() => ({}));
                                notify(j.error || 'Delete failed.', 'error');
                                return;
                            }
                            await reload();
                        } catch {
                            notify('Network error. Delete failed.', 'error');
                        }
                    }} className="button danger"><Trash2 size={16}/> Delete
                    </button>
                </div>
            </article>)}</div>
        </div>
    </section>
}
