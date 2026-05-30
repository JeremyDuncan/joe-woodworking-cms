import React from 'react';
import {Flag} from 'lucide-react';
import {Link} from '../lib/navigation.jsx';
import {InlineText, useEdit} from '../lib/edit.jsx';
import {defaultSettings} from '../data/defaults.js';

export function SiteHeader({settings}) {
    const {editing, setField} = useEdit();
    const nav = settings.nav || defaultSettings.nav;
    const brandText = settings.brandShort || settings.brandName;
    return <header className="site-header">
        {editing
            ? <span className="brand">
                <span className="brand-mark"><Flag size={18}/></span>
                <InlineText value={brandText} placeholder="Brand"
                            onChange={v => setField(['brandShort'], v)}/>
              </span>
            : <Link to="/" className="brand" aria-label={`${brandText || 'Brand'} home`}>
                <span className="brand-mark"><Flag size={18}/></span><span>{brandText}</span>
              </Link>}
        <nav>{nav.map((n, i) => editing
            ? <InlineText key={n.path} value={n.label} placeholder="Label"
                          onChange={v => setField(['nav'], nav.map((m, j) => j === i ? {...m, label: v} : m))}/>
            : <Link key={n.path} to={n.path}
                    className={n.path === '/contact' ? 'nav-cta' : ''}>{n.label}</Link>)}</nav>
    </header>
}
