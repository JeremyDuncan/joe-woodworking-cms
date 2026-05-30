import React from 'react';
import {Flag} from 'lucide-react';
import {Link} from '../lib/navigation.jsx';
import {defaultSettings} from '../data/defaults.js';

export function SiteHeader({settings}) {
    return <header className="site-header"><Link to="/" className="brand"
                                                 aria-label={`${settings.brandShort || settings.brandName || 'Brand'} home`}><span className="brand-mark"><Flag
        size={18}/></span><span>{settings.brandShort || settings.brandName}</span></Link>
        <nav>{(settings.nav || defaultSettings.nav).map(n => <Link key={n.path} to={n.path}
                                                                   className={n.path === '/contact' ? 'nav-cta' : ''}>{n.label}</Link>)}</nav>
    </header>
}
