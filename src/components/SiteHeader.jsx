import React, {useState} from 'react';
import {Menu, X} from 'lucide-react';
import {Link} from '../lib/navigation.jsx';
import {InlineText, useEdit} from '../lib/edit.jsx';
import {DynamicIcon} from '../lib/icons.jsx';
import {EditableIcon} from './IconPicker.jsx';
import {defaultSettings} from '../data/defaults.js';

export function SiteHeader({settings}) {
    const {editing, setField} = useEdit();
    const [open, setOpen] = useState(false);
    const nav = settings.nav || defaultSettings.nav;
    const menu = nav.filter(n => !n.hidden);
    const brandText = settings.brandShort || settings.brandName;
    const brandIcon = settings.brandIcon || 'Flag';
    const setNav = (path, patch) => setField(['nav'], nav.map(m => m.path === path ? {...m, ...patch} : m));

    return <header className="site-header">
        {editing
            ? <span className="brand">
                <span className="brand-mark"><EditableIcon className="ui-icon" name={brandIcon} fallback="Flag"
                                                           size={18} editing
                                                           onChange={v => setField(['brandIcon'], v)}/></span>
                <InlineText value={brandText} placeholder="Brand" onChange={v => setField(['brandShort'], v)}/>
              </span>
            : <Link to="/" className="brand" aria-label={`${brandText || 'Brand'} home`}>
                <span className="brand-mark"><DynamicIcon className="ui-icon" name={brandIcon} size={18}/></span>
                <span>{brandText}</span>
              </Link>}

        <button type="button" className="nav-hamburger" aria-label="Toggle menu" aria-expanded={open}
                onClick={() => setOpen(o => !o)}>
            {open ? <X size={22}/> : <Menu size={22}/>}
        </button>

        <nav className={open ? 'nav-open' : undefined}>{menu.map(n => editing
            ? <span key={n.path} className={`nav-item${n.cta ? ' nav-cta' : ''}`}>
                <EditableIcon className="ui-icon" name={n.icon} fallback="Star" size={15} editing allowNone
                              onChange={v => setNav(n.path, {icon: v})}/>
                <InlineText value={n.label} placeholder="Label" onChange={v => setNav(n.path, {label: v})}/>
              </span>
            : <Link key={n.path} to={n.path} className={`nav-item${n.cta ? ' nav-cta' : ''}`}
                    onClick={() => setOpen(false)}>
                {n.icon ? <DynamicIcon className="ui-icon" name={n.icon} size={15}/> : null}<span>{n.label}</span>
              </Link>)}</nav>
    </header>
}
