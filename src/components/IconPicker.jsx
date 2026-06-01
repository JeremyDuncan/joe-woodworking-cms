import React, {useState} from 'react';
import {createPortal} from 'react-dom';
import {Plus} from 'lucide-react';
import {ICONS, DynamicIcon} from '../lib/icons.jsx';

export function IconPicker({value, onSelect, onClose, allowNone}) {
    const [q, setQ] = useState('');
    const names = Object.keys(ICONS).filter(n => n.toLowerCase().includes(q.toLowerCase()));
    // Portal to <body> so an ancestor with backdrop-filter/transform (e.g. the
    // fixed site header) can't clip the fixed modal.
    return createPortal(<div className="icon-modal-backdrop" onClick={onClose}>
        <div className="icon-modal" onClick={e => e.stopPropagation()}>
            <div className="icon-modal-head">
                <input autoFocus placeholder="Search icons" value={q} onChange={e => setQ(e.target.value)}/>
                <button type="button" className="theme-close" onClick={onClose}>×</button>
            </div>
            <div className="icon-grid">
                {allowNone && <button type="button" className={`icon-cell ${!value ? 'active' : ''}`}
                                      title="No icon" onClick={() => onSelect('')}>∅</button>}
                {names.map(n => {
                    const Cmp = ICONS[n];
                    return <button key={n} type="button" className={`icon-cell ${value === n ? 'active' : ''}`}
                                   title={n} onClick={() => onSelect(n)}><Cmp size={20}/></button>;
                })}
            </div>
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
