import React, {useEffect, useState} from 'react';
import {ChevronsDownUp, ChevronsUpDown, ChevronDown, ChevronRight, ChevronUp, EyeOff, LayoutTemplate, Map, Save, Search, Trash2} from 'lucide-react';
import {useDragPanel} from '../lib/useDragPanel.js';
import {promptDialog} from '../lib/dialog.jsx';
import {groupPages, pageLabel} from '../lib/pages.js';

function NavRow({p, route, index, total, onMove, onRename, onChangePath, onToggleNav, onToggleCta}) {
    const isHome = p.path === '/';
    const [path, setPath] = useState(p.path);
    useEffect(() => setPath(p.path), [p.path]);

    return <div className={`pages-row${p.path === route ? ' current' : ''}`}>
        <div className="pages-reorder">
            <button type="button" title="Move up" disabled={index === 0}
                    onClick={() => onMove(p.path, -1)}><ChevronUp size={14}/></button>
            <button type="button" title="Move down" disabled={index === total - 1}
                    onClick={() => onMove(p.path, 1)}><ChevronDown size={14}/></button>
        </div>
        <div className="pages-fields">
            <input className="pages-label-input" value={p.label} placeholder="Name"
                   onChange={e => onRename(p.path, e.target.value)}/>
            {isHome
                ? <span className="pages-path">/</span>
                : <input className="pages-path-input" value={path} placeholder="/path"
                         onChange={e => setPath(e.target.value)} onBlur={() => onChangePath(p.path, path)}/>}
        </div>
        <div className="pages-row-actions">
            <label className="pages-btntoggle" title="Style this nav link as a call-to-action button">
                <input type="checkbox" checked={!!p.cta} onChange={() => onToggleCta(p.path)}/> Btn
            </label>
            {!isHome && <button type="button" className="pages-icon-act" title="Remove from nav (keeps the page)"
                                onClick={() => onToggleNav(p.path)}><EyeOff size={15}/></button>}
        </div>
    </div>;
}

// "+ Nav link": pick an existing (unlinked) page and add it to the nav bar.
function AddNavLink({pages, onToggleNav}) {
    const [open, setOpen] = useState(false);
    const [openSections, setOpenSections] = useState({});
    const [q, setQ] = useState('');
    const candidates = (pages || []).filter(p => p.hidden);
    const term = q.trim().toLowerCase();
    const filtered = candidates.filter(p => !term || `${p.label || ''} ${p.path || ''}`.toLowerCase().includes(term));
    const {roots, sections} = groupPages(filtered);
    const sectionNames = Object.keys(sections).sort();
    const allOpen = sectionNames.length > 0 && sectionNames.every(sec => !!openSections[sec]);
    const expanded = sec => !!term || !!openSections[sec];
    const toggleAll = () => setOpenSections(allOpen ? {} : Object.fromEntries(sectionNames.map(sec => [sec, true])));
    const row = p => <button key={p.path} type="button" className="nav-add-item"
                             onClick={() => onToggleNav(p.path)}>
        <span className="sitemap-name">{pageLabel(p) || '(untitled)'}</span>
        <span className="sitemap-path">{p.path}</span>
        <span className="nav-add-plus">add</span>
    </button>;

    if (!open) return <button type="button" className="button button-primary pages-add"
                              onClick={() => setOpen(true)}>+ Nav link</button>;

    return <div className="nav-add">
        <div className="sitemap-search">
            <Search size={15}/>
            <input autoFocus placeholder="Search pages to add…" value={q} onChange={e => setQ(e.target.value)}/>
            {sectionNames.length > 0 && <button type="button" className="sitemap-search-clear panel-inline-expand"
                                                title={allOpen ? 'Collapse sections' : 'Expand sections'}
                                                onClick={toggleAll}>
                {allOpen ? <ChevronsDownUp size={14}/> : <ChevronsUpDown size={14}/>}
            </button>}
            <button type="button" className="sitemap-search-clear" title="Done"
                    onClick={() => {
                        setOpen(false);
                        setQ('');
                    }}>×
            </button>
        </div>
        <div className="nav-add-list">
            {filtered.length === 0 &&
                <p className="sitemap-empty">{candidates.length === 0 ? 'Every page is already a nav link.' : 'No matching pages.'}</p>}
            {roots.map(p => row(p))}
            {sectionNames.map(sec => <div key={sec} className="picker-section">
                <button type="button" className="picker-section-head"
                        onClick={() => setOpenSections(o => ({...o, [sec]: !o[sec]}))}>
                    <ChevronRight size={15} className={`picker-caret${expanded(sec) ? ' open' : ''}`}/>
                    <span className="picker-section-name">{sec}</span>
                    <span className="picker-count">{sections[sec].length}</span>
                </button>
                {expanded(sec) && sections[sec].map(row)}
            </div>)}
        </div>
    </div>;
}

// `tab`: 'nav' shows the nav-bar links, 'templates' shows layout templates.
// `docked` renders it as a static left flyout (no drag) for the admin bar.
export function PagesPanel({pages, route, templates, currentTemplate, onAddPage, onToggleNav, onToggleCta, onRename, onChangePath, onMove, onSaveTemplate, onApplyTemplate, onUpdateTemplate, onDeleteTemplate, onClose, docked, tab = 'both'}) {
    const [msg, setMsg] = useState('');
    const templateNames = Object.keys(templates || {});
    const isTemplate = !!(currentTemplate && templateNames.includes(currentTemplate));
    const {panelRef, onHeadDown, style} = useDragPanel();
    const showNav = tab !== 'templates';
    const showTemplates = tab !== 'nav';
    const title = tab === 'templates' ? 'Page templates' : tab === 'nav' ? 'Navigation' : 'Pages';
    const TitleIcon = tab === 'templates' ? LayoutTemplate : Map;
    const navPages = (pages || []).filter(p => !p.hidden);

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

    return <div className={`pages-panel${docked ? ' docked' : ''}`} ref={docked ? undefined : panelRef}
                style={docked ? undefined : style}>
        <div className={`theme-panel-head${docked ? '' : ' theme-drag'}`} onMouseDown={docked ? undefined : onHeadDown}>
            <strong><TitleIcon size={18}/> {title}</strong>
            <button type="button" className="theme-close" onClick={onClose}>×</button>
        </div>

        {showNav && <>
            <p className="pages-hint">Drag order with the arrows. These are the links shown in your top menu.</p>
            <div className="pages-list">
                {navPages.length === 0 && <p className="sitemap-empty">No nav links yet — add one below.</p>}
                {navPages.map((p, i) => <NavRow key={p.path} p={p} route={route} index={i} total={navPages.length}
                                                onMove={onMove} onRename={onRename} onChangePath={onChangePath}
                                                onToggleNav={onToggleNav} onToggleCta={onToggleCta}/>)}
            </div>
            <AddNavLink pages={pages} onToggleNav={onToggleNav}/>
        </>}

        {showTemplates && <div className="pages-templates">
            {showNav && <p className="theme-section">Layout templates</p>}
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
                <button type="button" className="button button-ghost" onClick={saveTemplate}><Save size={16}/>Save as
                    new
                </button>
                {isTemplate &&
                    <button type="button" className="button button-primary" onClick={updateTemplate}><Save
                        size={16}/>Update “{currentTemplate}”</button>}
                {isTemplate &&
                    <button type="button" className="button danger" onClick={deleteTemplate}><Trash2
                        size={16}/>Delete</button>}
            </div>
            {msg && <span className="theme-msg">{msg}</span>}
        </div>}
    </div>;
}
