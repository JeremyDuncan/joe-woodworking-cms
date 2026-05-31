import React, {useEffect, useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {navigate} from '../lib/navigation.jsx';
import {useDragPanel} from '../lib/useDragPanel.js';
import {promptDialog} from '../lib/dialog.jsx';
import {Files, Save, Trash2} from 'lucide-react'; // <-- ICONS

function PageRow({p, route, onRename, onChangePath, onDeletePage, onToggleNav, onToggleCta}) {
    const isHome = p.path === '/';
    const [path, setPath] = useState(p.path);
    useEffect(() => setPath(p.path), [p.path]);

    return <div className={`pages-row${p.path === route ? ' current' : ''}`}>
        <div className="pages-fields">
            <input className="pages-label-input" value={p.label} placeholder="Page name" maxLength={12}
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

export function PagesPanel({pages, route, templates, currentTemplate, onAddPage, onDeletePage, onToggleNav, onToggleCta, onRename, onChangePath, onSaveTemplate, onApplyTemplate, onUpdateTemplate, onDeleteTemplate, onClose}) {
    const [msg, setMsg] = useState('');
    const templateNames = Object.keys(templates || {});
    const isTemplate = !!(currentTemplate && templateNames.includes(currentTemplate));
    const {panelRef, onHeadDown, style} = useDragPanel();

    async function saveTemplate() {
        const name = await promptDialog('Save this page’s layout as a template named:', '', {maxLength: 12});
        if (!name || !name.trim()) return;
        setMsg('Saving…');
        try {
            await onSaveTemplate(name.trim());
            setMsg(`Saved template “${name.trim()}”`);
        } catch {
            setMsg('Save failed');
        }
    }

    async function updateTemplate() {
        if (!isTemplate) return;
        setMsg('Saving…');
        try {
            await onUpdateTemplate();
            setMsg(`Updated “${currentTemplate}”`);
        } catch {
            setMsg('Save failed');
        }
    }

    async function deleteTemplate() {
        if (!isTemplate) return;
        const name = currentTemplate;
        try {
            await onDeleteTemplate(name);
            setMsg(`Deleted “${name}”`);
        } catch {
            setMsg('Delete failed');
        }
    }

    return <div className="pages-panel" ref={panelRef} style={style}>
        <div className="theme-panel-head theme-drag" onMouseDown={onHeadDown}>
            <strong><Save size={18}/> Pages</strong>
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
            <p className="theme-current">This page: <strong>{currentTemplate || 'Custom (unsaved)'}</strong></p>
            <div className="theme-row"><span>Apply to this page</span>
                <select value={isTemplate ? currentTemplate : ''} onChange={e => {
                    if (e.target.value) onApplyTemplate(e.target.value);
                }}>
                    <option value="">— choose —</option>
                    {templateNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>
            <div className="theme-preset-actions">
                <button type="button" className="button button-ghost" onClick={saveTemplate}><Save size={16}/>Save as new</button>
                {isTemplate &&
                    <button type="button" className="button button-primary" onClick={updateTemplate}><Save size={16}/>Update
                        “{currentTemplate}”</button>}
                {isTemplate &&
                    <button type="button" className="button danger" onClick={deleteTemplate}><Trash2 size={16}/>Delete</button>}
            </div>
            {msg && <span className="theme-msg">{msg}</span>}
        </div>
    </div>;
}
