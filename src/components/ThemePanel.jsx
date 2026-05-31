import React, {useState} from 'react';
import {FONTS, defaultTheme} from '../lib/theme.js';
import {useDragPanel} from '../lib/useDragPanel.js';
import {confirmDialog, promptDialog} from '../lib/dialog.jsx';

// Not a <label>: wrapping the text in a label made clicking the text open the
// native colour picker. Only the swatch input should trigger it.
function Color({label, value, fallback, onChange}) {
    return <div className="theme-row"><span>{label}</span>
        <input type="color" value={value || fallback} onChange={e => onChange(e.target.value)}/>
    </div>;
}

export function ThemePanel({theme, themes, setField, onSavePreset, onDeletePreset, onClose}) {
    const t = theme || defaultTheme;
    const colors = {...defaultTheme.colors, ...(t.colors || {})};
    const text = {...defaultTheme.text, ...((t.text && typeof t.text === 'object' && !Array.isArray(t.text)) ? t.text : {})};
    const presetNames = Object.keys(themes || {});
    const [msg, setMsg] = useState('');
    // Editing keeps the applied preset name so you can still Update it.
    const setColor = (k, v) => setField(['theme', 'colors', k], v);
    const setText = (k, v) => setField(['theme', 'text', k], v);
    const setFont = v => setField(['theme', 'font'], v);

    const preset = t.name ? (themes || {})[t.name] : null;
    const stripName = o => JSON.stringify({...o, name: undefined});
    const isPreset = !!(t.name && presetNames.includes(t.name));
    const modified = preset ? stripName(t) !== stripName(preset) : false;

    const {panelRef, onHeadDown, style} = useDragPanel();

    function applyPreset(name) {
        if (name && themes[name]) setField(['theme'], {...JSON.parse(JSON.stringify(themes[name])), name});
    }

    async function saveAs() {
        const name = await promptDialog('Save this theme as:', '', {maxLength: 12});
        if (!name || !name.trim()) return;
        setMsg('Saving…');
        try {
            await onSavePreset(name.trim());
            setField(['theme', 'name'], name.trim());
            setMsg(`Saved “${name.trim()}”`);
        } catch {
            setMsg('Save failed');
        }
    }

    async function updatePreset() {
        if (!t.name) return;
        setMsg('Saving…');
        try {
            await onSavePreset(t.name);
            setMsg(`Updated “${t.name}”`);
        } catch {
            setMsg('Save failed');
        }
    }

    async function deletePreset() {
        if (!t.name || !onDeletePreset) return;
        const name = t.name;
        if (!(await confirmDialog(`Delete the theme “${name}”?`, {danger: true, okLabel: 'Delete'}))) return;
        try {
            await onDeletePreset(name);
            setMsg(`Deleted “${name}”`);
        } catch {
            setMsg('Delete failed');
        }
    }

    return <div className="theme-panel" ref={panelRef} style={style}>
        <div className="theme-panel-head theme-drag" onMouseDown={onHeadDown}>
            <strong>Theme</strong>
            <button type="button" className="theme-close" onClick={onClose}>×</button>
        </div>

        <div className="theme-scroll">
            <div className="theme-row"><span>Font</span>
                <select value={t.font || 'Inter'} onChange={e => setFont(e.target.value)}>
                    {Object.keys(FONTS).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
            </div>

            <p className="theme-section">Background</p>
            <Color label="Background" value={colors.background} fallback="#08111f"
                   onChange={v => setColor('background', v)}/>
            <Color label="Gradient 1 · top-left" value={colors.gradient1} fallback="#b51f2b"
                   onChange={v => setColor('gradient1', v)}/>
            <Color label="Gradient 2 · top-right" value={colors.gradient2} fallback="#2458a3"
                   onChange={v => setColor('gradient2', v)}/>
            <Color label="Gradient 3 · bottom-left" value={colors.gradient3} fallback="#08111f"
                   onChange={v => setColor('gradient3', v)}/>
            <Color label="Gradient 4 · bottom-right" value={colors.gradient4} fallback="#08111f"
                   onChange={v => setColor('gradient4', v)}/>

            <p className="theme-section">Buttons & icons</p>
            <Color label="Button fill" value={colors.button} fallback="#e33445"
                   onChange={v => setColor('button', v)}/>
            <Color label="Icon color" value={colors.icon} fallback="#d7a64f"
                   onChange={v => setColor('icon', v)}/>
            <Color label="Card hover border" value={colors.hover} fallback="#d7a64f"
                   onChange={v => setColor('hover', v)}/>

            <p className="theme-section">Text</p>
            <Color label="Heading" value={text.heading} fallback="#fffaf0" onChange={v => setText('heading', v)}/>
            <Color label="Paragraph" value={text.paragraph} fallback="#b8c2d6" onChange={v => setText('paragraph', v)}/>
            <Color label="Navigation" value={text.nav} fallback="#fffaf0" onChange={v => setText('nav', v)}/>
            <Color label="Button" value={text.button} fallback="#ffffff" onChange={v => setText('button', v)}/>
            <Color label="Eyebrow" value={text.eyebrow} fallback="#d7a64f" onChange={v => setText('eyebrow', v)}/>
            <Color label="List" value={text.list} fallback="#f4ead8" onChange={v => setText('list', v)}/>
            <Color label="Featured" value={text.featured} fallback="#d7a64f" onChange={v => setText('featured', v)}/>
        </div>

        <div className="theme-presets">
            <p className="theme-current">Current: <strong>{t.name || 'Custom (unsaved)'}</strong>
                {isPreset && modified ? <span className="theme-edited"> · edited</span> : null}</p>
            <div className="theme-row"><span>Apply preset</span>
                <select value={isPreset ? t.name : ''} onChange={e => applyPreset(e.target.value)}>
                    <option value="">— choose —</option>
                    {presetNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>
            <div className="theme-preset-actions">
                <button type="button" className="button button-ghost" onClick={saveAs}>Save as new</button>
                {isPreset &&
                    <button type="button" className="button button-primary" onClick={updatePreset}>Update
                        “{t.name}”</button>}
                {isPreset &&
                    <button type="button" className="button danger" onClick={deletePreset}>Delete</button>}
            </div>
            {msg && <span className="theme-msg">{msg}</span>}
        </div>
    </div>;
}
