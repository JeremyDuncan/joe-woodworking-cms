import React, {useState} from 'react';
import {createPortal} from 'react-dom';
import {ChevronRight, Globe, Search, X} from 'lucide-react';
import {groupPages, pageLabel} from '../lib/pages.js';

function PickRow({p, current, indent, onPick}) {
    return <button type="button" className={`picker-row${indent ? ' indent' : ''}${p.path === current ? ' current' : ''}`}
                   onClick={() => onPick(p.path)}>
        <span className="sitemap-name">{pageLabel(p) || '(untitled)'}</span>
        <span className="sitemap-path">{p.path}</span>
    </button>;
}

// A searchable, section-grouped modal for choosing a page to link to. `onPick(path)`
// selects a page; `onExternal` (optional) switches to entering an external URL.
export function PagePicker({pages, current, title = 'Link to a page', onPick, onExternal, onClose}) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState({});
    const q = query.trim().toLowerCase();
    const filtered = (pages || []).filter(p => !q || `${p.label || ''} ${p.path || ''}`.toLowerCase().includes(q));
    const {roots, sections} = groupPages(filtered);
    const expanded = sec => !Object.prototype.hasOwnProperty.call(open, sec) ? true : !!open[sec];

    return createPortal(
        <div className="dialog-backdrop" onMouseDown={onClose}>
            <div className="dialog page-picker" onMouseDown={e => e.stopPropagation()}>
                <div className="page-picker-head">
                    <strong>{title}</strong>
                    <button type="button" className="theme-close" onClick={onClose}><X size={16}/></button>
                </div>
                <div className="sitemap-search">
                    <Search size={15}/>
                    <input autoFocus placeholder="Search pages…" value={query}
                           onChange={e => setQuery(e.target.value)}/>
                    {query && <button type="button" className="sitemap-search-clear" title="Clear"
                                      onClick={() => setQuery('')}>×</button>}
                </div>

                <div className="page-picker-list">
                    {filtered.length === 0 && <p className="sitemap-empty">No pages match “{query}”.</p>}
                    {roots.map(p => <PickRow key={p.path} p={p} current={current} onPick={onPick}/>)}
                    {Object.keys(sections).sort().map(sec => <div key={sec} className="picker-section">
                        <button type="button" className="picker-section-head"
                                onClick={() => setOpen(o => ({...o, [sec]: !o[sec]}))}>
                            <ChevronRight size={15} className={`picker-caret${expanded(sec) ? ' open' : ''}`}/>
                            <span className="picker-section-name">{sec}</span>
                            <span className="picker-count">{sections[sec].length}</span>
                        </button>
                        {expanded(sec) && sections[sec].map(p =>
                            <PickRow key={p.path} p={p} current={current} indent onPick={onPick}/>)}
                    </div>)}
                </div>

                {onExternal && <div className="page-picker-foot">
                    <button type="button" className="button button-ghost" onClick={onExternal}>
                        <Globe size={16}/> External link instead…
                    </button>
                </div>}
            </div>
        </div>, document.body);
}
