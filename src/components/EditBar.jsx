import React from 'react';
import {Edit3, Save} from 'lucide-react';
import {navigate} from '../lib/navigation.jsx';

export function EditBar({editing, saveState, adminPath, pages, onEnter, onSave, onDiscard}) {
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
        <div className="edit-bar-pages">{(pages || []).map(p => <button key={p.path} type="button"
                                                                          onClick={() => navigate(p.path)}>{p.label}</button>)}</div>
        <button type="button" className="button button-primary" onClick={onSave} disabled={saveState === 'saving'}>
            <Save size={16}/> {saveState === 'saving' ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="button button-ghost" onClick={onDiscard}>Discard</button>
        {saveState === 'error' && <span className="error">Save failed</span>}
    </div>;
}
