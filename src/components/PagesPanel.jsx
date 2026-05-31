import React, {useState} from 'react';
import {navigate} from '../lib/navigation.jsx';

export function PagesPanel({pages, route, templates, onAddPage, onDeletePage, onToggleNav, onSaveTemplate, onApplyTemplate, onClose}) {
    const [msg, setMsg] = useState('');
    const templateNames = Object.keys(templates || {});

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

    return <div className="pages-panel">
        <div className="theme-panel-head">
            <strong>Pages</strong>
            <button type="button" className="theme-close" onClick={onClose}>×</button>
        </div>

        <div className="pages-list">
            {(pages || []).map(p => <div key={p.path} className={`pages-row${p.path === route ? ' current' : ''}`}>
                <button type="button" className="pages-go" onClick={() => navigate(p.path)}>{p.label}
                    <span className="pages-path">{p.path}</span></button>
                <label className="pages-navtoggle" title="Show in the top navigation menu">
                    <input type="checkbox" checked={!p.hidden} disabled={p.path === '/'}
                           onChange={() => onToggleNav(p.path)}/> Nav
                </label>
                {p.path !== '/' &&
                    <button type="button" className="pages-del" title="Delete page"
                            onClick={() => onDeletePage(p.path)}>×</button>}
            </div>)}
        </div>

        <button type="button" className="button button-primary pages-add" onClick={onAddPage}>+ Add page</button>

        <div className="pages-templates">
            <p className="theme-section">Layout templates</p>
            <label className="theme-row">Apply to this page
                <select value="" onChange={e => {
                    if (e.target.value) onApplyTemplate(e.target.value);
                }}>
                    <option value="">— choose —</option>
                    {templateNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </label>
            <button type="button" className="button button-ghost" onClick={saveTemplate}>Save this layout as template
            </button>
            {msg && <span className="theme-msg">{msg}</span>}
        </div>
    </div>;
}
