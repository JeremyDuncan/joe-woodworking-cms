import React from 'react';
import {FONTS, defaultTheme} from '../lib/theme.js';

export function ThemePanel({theme, themes, setField, onClose}) {
    const t = theme || defaultTheme;
    const colors = {...defaultTheme.colors, ...(t.colors || {})};
    const presetNames = Object.keys(themes || {});
    const setColor = (key, value) => setField(['theme', 'colors', key], value);

    function applyPreset(name) {
        if (name && themes[name]) setField(['theme'], JSON.parse(JSON.stringify(themes[name])));
    }

    function saveAs() {
        const name = prompt('Save this theme as:');
        if (name && name.trim()) setField(['themes', name.trim()], JSON.parse(JSON.stringify(t)));
    }

    return <div className="theme-panel">
        <div className="theme-panel-head">
            <strong>Theme</strong>
            <button type="button" className="theme-close" onClick={onClose}>×</button>
        </div>

        <label className="theme-row">Font
            <select value={t.font || 'Inter'} onChange={e => setField(['theme', 'font'], e.target.value)}>
                {Object.keys(FONTS).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
        </label>

        <label className="theme-row">Accent
            <input type="color" value={colors.accent} onChange={e => setColor('accent', e.target.value)}/></label>
        <label className="theme-row">Primary
            <input type="color" value={colors.primary} onChange={e => setColor('primary', e.target.value)}/></label>
        <label className="theme-row">Background
            <input type="color" value={colors.background} onChange={e => setColor('background', e.target.value)}/></label>
        <label className="theme-row">Text
            <input type="color" value={colors.text} onChange={e => setColor('text', e.target.value)}/></label>

        <div className="theme-presets">
            <label className="theme-row">Preset
                <select value="" onChange={e => applyPreset(e.target.value)}>
                    <option value="">— choose —</option>
                    {presetNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </label>
            <button type="button" className="button button-ghost" onClick={saveAs}>Save as new theme</button>
        </div>
    </div>;
}
