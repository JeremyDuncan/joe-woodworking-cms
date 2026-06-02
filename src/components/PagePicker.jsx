import React, {useState} from 'react';
import {createPortal} from 'react-dom';
import {ChevronsDownUp, ChevronsUpDown, ChevronRight, Globe, Search, X} from 'lucide-react';
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
    const sectionNames = Object.keys(sections).sort();
    const allOpen = sectionNames.length > 0 && sectionNames.every(sec => !!open[sec]);
    const expanded = sec => !!q || !!open[sec];
    const toggleAll = () => setOpen(allOpen ? {} : Object.fromEntries(sectionNames.map(sec => [sec, true])));

    return createPortal(
        <div className="dialog-backdrop" onMouseDown={onClose}>
            <div className="dialog page-picker" onMouseDown={e => e.stopPropagation()}>
                <div className="page-picker-head">
                    <strong>{title}</strong>
                    <div className="panel-head-actions">
                        {sectionNames.length > 0 && <button type="button" className="panel-icon-action"
                                                            title={allOpen ? 'Collapse sections' : 'Expand sections'}
                                                            onClick={toggleAll}>
                            {allOpen ? <ChevronsDownUp size={16}/> : <ChevronsUpDown size={16}/>}
                        </button>}
                        <button type="button" className="theme-close" onClick={onClose}><X size={16}/></button>
                    </div>
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
                    {sectionNames.map(sec => <div key={sec} className="picker-section">
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
