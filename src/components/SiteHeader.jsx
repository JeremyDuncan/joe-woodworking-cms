import React, {useState} from 'react';
import {Link} from '../lib/navigation.jsx';
import {InlineText, useEdit} from '../lib/edit.jsx';
import {DynamicIcon} from '../lib/icons.jsx';
import {IconPicker} from './IconPicker.jsx';
import {defaultSettings} from '../data/defaults.js';

export function SiteHeader({settings}) {
    const {editing, setField} = useEdit();
    const [pickIcon, setPickIcon] = useState(false);
    const nav = settings.nav || defaultSettings.nav;
    const brandText = settings.brandShort || settings.brandName;
    const brandIcon = settings.brandIcon || 'Flag';
    return <header className="site-header">
        {editing
            ? <span className="brand">
                <button type="button" className="brand-mark brand-mark-btn" title="Choose icon"
                        onClick={() => setPickIcon(true)}><DynamicIcon className="ui-icon" name={brandIcon} size={18}/>
                </button>
                <InlineText value={brandText} placeholder="Brand" onChange={v => setField(['brandShort'], v)}/>
                {pickIcon && <IconPicker value={brandIcon}
                                         onSelect={n => {
                                             setField(['brandIcon'], n);
                                             setPickIcon(false);
                                         }} onClose={() => setPickIcon(false)}/>}
              </span>
            : <Link to="/" className="brand" aria-label={`${brandText || 'Brand'} home`}>
                <span className="brand-mark"><DynamicIcon className="ui-icon" name={brandIcon} size={18}/></span><span>{brandText}</span>
              </Link>}
        <nav>{nav.map((n, i) => editing
            ? <InlineText key={n.path} value={n.label} placeholder="Label"
                          onChange={v => setField(['nav'], nav.map((m, j) => j === i ? {...m, label: v} : m))}/>
            : <Link key={n.path} to={n.path}
                    className={n.path === '/contact' ? 'nav-cta' : ''}>{n.label}</Link>)}</nav>
    </header>
}
