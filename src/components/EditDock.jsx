import React, {useState} from 'react';
import {ChevronLeft, ChevronRight, LayoutTemplate, Map, Palette, Save, Settings, Undo2} from 'lucide-react';
import {PagesPanel} from './PagesPanel.jsx';
import {ThemePanel} from './ThemePanel.jsx';

// The in-edit toolset: a collapsed cogwheel that opens a slim left rail. The rail's
// sections (Navigation, Page templates, Theme) each pop out a flyout to its right.
// Save / Discard live at the bottom of the rail.
export function EditDock({saveState, onSave, onDiscard, pagesProps, themeProps}) {
    const [open, setOpen] = useState(false);
    const [section, setSection] = useState(null); // 'nav' | 'templates' | 'theme'
    const toggle = s => setSection(cur => (cur === s ? null : s));

    if (!open) {
        return <button type="button" className="dock-cog" title="Editing tools" onClick={() => setOpen(true)}>
            <Settings size={22}/>
        </button>;
    }

    const navItem = (id, Icon, label) =>
        <button type="button" className={`dock-section${section === id ? ' active' : ''}`} onClick={() => toggle(id)}>
            <Icon size={18}/><span>{label}</span><ChevronRight size={15} className="dock-section-caret"/>
        </button>;

    return <>
        <div className="edit-dock">
            <div className="dock-head">
                <span className="dock-title">Editing</span>
                <button type="button" className="dock-collapse" title="Hide tools"
                        onClick={() => {
                            setSection(null);
                            setOpen(false);
                        }}><ChevronLeft size={18}/></button>
            </div>

            <div className="dock-sections">
                {navItem('nav', Map, 'Navigation')}
                {navItem('templates', LayoutTemplate, 'Page templates')}
                {navItem('theme', Palette, 'Theme')}
            </div>

            <div className="dock-footer">
                <button type="button" className="button btn-save edit-icon-btn" onClick={onSave}
                        disabled={saveState === 'saving'}>
                    <Save size={16}/> {saveState === 'saving' ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="button danger edit-icon-btn" onClick={onDiscard}>
                    <Undo2 size={16}/> Discard
                </button>
                {saveState === 'error' && <span className="error">Save failed</span>}
            </div>
        </div>

        {section === 'nav' &&
            <PagesPanel {...pagesProps} tab="nav" docked onClose={() => setSection(null)}/>}
        {section === 'templates' &&
            <PagesPanel {...pagesProps} tab="templates" docked onClose={() => setSection(null)}/>}
        {section === 'theme' &&
            <ThemePanel {...themeProps} docked onClose={() => setSection(null)}/>}
    </>;
}
