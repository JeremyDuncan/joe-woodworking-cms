import React, {useEffect, useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {navigate} from '../lib/navigation.jsx';
import {useDragPanel} from '../lib/useDragPanel.js';

function PageRow({p, route, onRename, onChangePath, onDeletePage, onToggleNav, onToggleCta}) {
    const isHome = p.path === '/';
    const [path, setPath] = useState(p.path);
    useEffect(() => setPath(p.path), [p.path]);

    return <div className={`pages-row${p.path === route ? ' current' : ''}`}>
        <div className="pages-fields">
            <input className="pages-label-input" value={p.label} placeholder="Page name"
                   onChange={e => onRename(p.path, e.target.value)}/>
            {isHome
                ? <span className="pages-path">/</span>
                : <input className="pages-path-input" value={path} placeholder="/path"
                         onChange={e => setPath(e.target.value)} onBlur={() => onChangePath(p.path, path)}/>}
        </div>
        <div className="pages-row-actions">
            <button type="button" className="pages-go" title="Go to page" onClick={() => navigate(p.path)}>
                <ArrowUpRight size={15}/></button>
            <label className="pages-navtoggle" title="Show in the top navigation menu">
                <input type="checkbox" checked={!p.hidden} disabled={isHome} onChange={() => onToggleNav(p.path)}/> Nav
            </label>
            <label className="pages-navtoggle" title="Style this nav link as a button">
                <input type="checkbox" checked={!!p.cta} onChange={() => onToggleCta(p.path)}/> Btn
            </label>
            {!isHome && <button type="button" className="pages-del" title="Delete page"
                                onClick={() => onDeletePage(p.path)}>×</button>}
        </div>
    </div>;
}

export function PagesPanel({pages, route, templates, onAddPage, onDeletePage, onToggleNav, onToggleCta, onRename, onChangePath, onSaveTemplate, onApplyTemplate, onClose}) {
    const [msg, setMsg] = useState('');
    const templateNames = Object.keys(templates || {});
    const {panelRef, onHeadDown, style} = useDragPanel();

    async function saveTemplate() {
        const name = prompt('Save this page’s layout as a template named:');
        if (!name || !name.trim()) return;
        setMsg('Saving…');
        try {
            await onSaveTemplate(name.trim());
            setMsg(`Saved template “${name.trim()}”`);
        } catch {
            setMsg('Save failed');
        }
    }

    return <div className="pages-panel" ref={panelRef} style={style}>
        <div className="theme-panel-head theme-drag" onMouseDown={onHeadDown}>
            <strong>Pages</strong>
            <button type="button" className="theme-close" onClick={onClose}>×</button>
        </div>

        <div className="pages-list">
            {(pages || []).map(p => <PageRow key={p.path} p={p} route={route} onRename={onRename}
                                             onChangePath={onChangePath} onDeletePage={onDeletePage}
                                             onToggleNav={onToggleNav} onToggleCta={onToggleCta}/>)}
        </div>

        <button type="button" className="button button-primary pages-add" onClick={onAddPage}>+ Add page</button>

        <div className="pages-templates">
            <p className="theme-section">Layout templates</p>
            <div className="theme-row"><span>Apply to this page</span>
                <select value="" onChange={e => {
                    if (e.target.value) onApplyTemplate(e.target.value);
                }}>
                    <option value="">— choose —</option>
                    {templateNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>
            <button type="button" className="button button-ghost" onClick={saveTemplate}>Save this layout as template
            </button>
            {msg && <span className="theme-msg">{msg}</span>}
        </div>
    </div>;
}
