import React, {useState} from 'react';
import {createPortal} from 'react-dom';
import {Plus} from 'lucide-react';
import {ICONS, ICON_NAMES, ICON_LIB, ICON_LIBRARIES, DynamicIcon} from '../lib/icons.jsx';

// With thousands of icons across several libraries we can't paint them all at once, so we
// cap the grid and nudge the user to keep typing (or pick a library) when there are more
// matches than we show.
const CAP = 500;

export function IconPicker({value, onSelect, onClose, allowNone}) {
    const [q, setQ] = useState('');
    const [lib, setLib] = useState('all');
    const term = q.trim().toLowerCase();
    const base = lib === 'all' ? ICON_NAMES : ICON_NAMES.filter(n => ICON_LIB[n] === lib);
    const matches = term ? base.filter(n => n.toLowerCase().includes(term)) : base;
    const shown = matches.slice(0, CAP);
    // Portal to <body> so an ancestor with backdrop-filter/transform (e.g. the
    // fixed site header) can't clip the fixed modal.
    return createPortal(<div className="icon-modal-backdrop" onClick={onClose}>
        <div className="icon-modal" onClick={e => e.stopPropagation()}>
            <div className="icon-modal-head">
                <input autoFocus placeholder={`Search ${ICON_NAMES.length} icons…`} value={q}
                       onChange={e => setQ(e.target.value)}/>
                <button type="button" className="theme-close" onClick={onClose}>×</button>
            </div>
            <div className="icon-libs">
                <button type="button" className={`icon-lib ${lib === 'all' ? 'active' : ''}`}
                        onClick={() => setLib('all')}>All</button>
                {ICON_LIBRARIES.map(l => <button key={l.id} type="button"
                                                 className={`icon-lib ${lib === l.id ? 'active' : ''}`}
                                                 onClick={() => setLib(l.id)}>{l.label}</button>)}
            </div>
            <div className="icon-grid">
                {allowNone && <button type="button" className={`icon-cell ${!value ? 'active' : ''}`}
                                      title="No icon" onClick={() => onSelect('')}>∅</button>}
                {shown.map(n => {
                    const Cmp = ICONS[n];
                    return <button key={n} type="button" className={`icon-cell ${value === n ? 'active' : ''}`}
                                   title={n} onClick={() => onSelect(n)}><Cmp size={20}/></button>;
                })}
            </div>
            {matches.length === 0
                ? <p className="icon-modal-note">No icons match “{q}”.</p>
                : matches.length > CAP &&
                <p className="icon-modal-note">Showing {CAP} of {matches.length} — keep typing or pick a library.</p>}
        </div>
    </div>, document.body);
}

// Renders an icon that, in edit mode, is itself the clickable trigger for the picker.
export function EditableIcon({name, fallback, size = 16, editing, allowNone, onChange, className}) {
    const [open, setOpen] = useState(false);
    if (!editing) {
        if (!name && allowNone) return null;
        return <DynamicIcon className={className} name={name || fallback} size={size}/>;
    }
    return <button type="button" className="icon-edit-btn" title="Change icon" onClick={() => setOpen(true)}>
        {(name || !allowNone)
            ? <DynamicIcon className={className} name={name || fallback} size={size}/>
            : <Plus size={size}/>}
        {open && <IconPicker value={name} allowNone={allowNone}
                             onSelect={n => {
                                 onChange(n);
                                 setOpen(false);
                             }} onClose={() => setOpen(false)}/>}
    </button>;
}

// Small labelled trigger used inside block control bars.
export function IconControl({label = 'Icon', value, fallback, allowNone, onChange}) {
    const [open, setOpen] = useState(false);
    return <span className="block-ctl icon-ctl">{label}
        <button type="button" className="icon-ctl-btn" title="Choose icon" onClick={() => setOpen(true)}>
            {value || !allowNone ? <DynamicIcon name={value || fallback} size={16}/> : '∅'}
        </button>
        {open && <IconPicker value={value} allowNone={allowNone}
                             onSelect={n => {
                                 onChange(n);
                                 setOpen(false);
                             }} onClose={() => setOpen(false)}/>}
    </span>;
}
