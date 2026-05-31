import React, {useEffect, useRef, useState} from 'react';
import {FONTS, defaultTheme} from '../lib/theme.js';

function Color({label, value, fallback, onChange}) {
    return <label className="theme-row">{label}
        <input type="color" value={value || fallback} onChange={e => onChange(e.target.value)}/>
    </label>;
}

export function ThemePanel({theme, themes, setField, onSavePreset, onClose}) {
    const t = theme || defaultTheme;
    const colors = {...defaultTheme.colors, ...(t.colors || {})};
    const text = {...defaultTheme.text, ...((t.text && typeof t.text === 'object' && !Array.isArray(t.text)) ? t.text : {})};
    const presetNames = Object.keys(themes || {});
    const [msg, setMsg] = useState('');
    const setColor = (k, v) => setField(['theme', 'colors', k], v);
    const setText = (k, v) => setField(['theme', 'text', k], v);

    // Draggable panel
    const panelRef = useRef(null);
    const dragRef = useRef(null);
    const [pos, setPos] = useState(null);

    function onHeadDown(e) {
        if (e.button !== 0 || e.target.closest('.theme-close')) return;
        const rect = panelRef.current.getBoundingClientRect();
        dragRef.current = {dx: e.clientX - rect.left, dy: e.clientY - rect.top};
        e.preventDefault();
    }

    useEffect(() => {
        function move(e) {
            if (!dragRef.current) return;
            setPos({x: e.clientX - dragRef.current.dx, y: e.clientY - dragRef.current.dy});
        }

        function up() {
            dragRef.current = null;
        }

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
        };
    }, []);

    const style = pos ? {left: pos.x, top: pos.y, right: 'auto', bottom: 'auto', transform: 'none'} : undefined;

    function applyPreset(name) {
        if (name && themes[name]) setField(['theme'], JSON.parse(JSON.stringify(themes[name])));
    }

    async function saveAs() {
        const name = prompt('Save this theme as:');
        if (!name || !name.trim()) return;
        setMsg('Saving…');
        try {
            await onSavePreset(name.trim());
            setMsg(`Saved “${name.trim()}”`);
        } catch {
            setMsg('Save failed');
        }
    }

    return <div className="theme-panel" ref={panelRef} style={style}>
        <div className="theme-panel-head theme-drag" onMouseDown={onHeadDown}>
            <strong>Theme</strong>
            <button type="button" className="theme-close" onClick={onClose}>×</button>
        </div>

        <div className="theme-scroll">
            <label className="theme-row">Font
                <select value={t.font || 'Inter'} onChange={e => setField(['theme', 'font'], e.target.value)}>
                    {Object.keys(FONTS).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
            </label>

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
            <label className="theme-row">Preset
                <select value="" onChange={e => applyPreset(e.target.value)}>
                    <option value="">— choose —</option>
                    {presetNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </label>
            <button type="button" className="button button-ghost" onClick={saveAs}>Save as new theme</button>
            {msg && <span className="theme-msg">{msg}</span>}
        </div>
    </div>;
}
