import React from 'react';
import {Edit3, Files, Palette, Save, Undo2} from 'lucide-react';
import {navigate} from '../lib/navigation.jsx';

export function EditBar({editing, saveState, adminPath, pages, route, onEnter, onSave, onDiscard, onTheme, onPages}) {
    if (!editing) {
        return <div className="edit-bar">
            <span className="edit-bar-label"><Edit3 size={15}/> Admin</span>
            <button type="button" className="button button-primary" onClick={onEnter}><Edit3 size={16}/> Edit site
            </button>
            <a className="button button-ghost" href={adminPath}>Dashboard</a>
        </div>;
    }
    return <div className="edit-bar editing">
        <span className="edit-bar-label"><Edit3 size={15}/> Editing</span>
        <nav className="edit-bar-pages" aria-label="Pages">{(pages || []).map(p =>
            <button key={p.path} type="button" className={p.path === route ? 'active' : ''}
                    onClick={() => navigate(p.path)}>{p.label}</button>)}</nav>
        <span className="edit-bar-sep"/>
        <button type="button" className="button button-ghost edit-icon-btn" onClick={onPages}><Files size={16}/> Pages
        </button>
        <button type="button" className="button button-ghost edit-icon-btn" onClick={onTheme}><Palette size={16}/> Theme
        </button>
        <button type="button" className="button btn-save edit-icon-btn" onClick={onSave}
                disabled={saveState === 'saving'}>
            <Save size={16}/> {saveState === 'saving' ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="button danger edit-icon-btn" onClick={onDiscard}><Undo2 size={16}/> Discard
        </button>
        {saveState === 'error' && <span className="error">Save failed</span>}
    </div>;
}
