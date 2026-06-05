import React from 'react';
import * as Lucide from 'lucide-react';
import * as FontAwesome from 'react-icons/fa6';
import * as Material from 'react-icons/md';
import * as Bootstrap from 'react-icons/bs';

// Icons come from several free libraries. Each glyph is stored by its component name
// (Lucide names are bare like "Star"; react-icons names are prefixed: "FaInstagram",
// "MdHome", "BsHeart"), so the sets never collide and old saved icons keep resolving.

// Lucide ships ~1,500 icons plus a few non-icon exports and duplicate "<Name>Icon" /
// "Lucide<Name>" aliases — drop those so each glyph appears once.
const LUCIDE_SKIP = new Set(['createLucideIcon', 'Icon', 'icons', 'default']);

function collectLucide() {
    const out = {};
    for (const [name, val] of Object.entries(Lucide)) {
        if (LUCIDE_SKIP.has(name)) continue;
        if (!/^[A-Z]/.test(name)) continue;
        if (name.endsWith('Icon') || name.startsWith('Lucide')) continue;
        if (val && (typeof val === 'function' || typeof val === 'object')) out[name] = val;
    }
    return out;
}

// react-icons sets export one function component per icon (PascalCase, set-prefixed).
function collectReactIcons(mod) {
    const out = {};
    for (const [name, val] of Object.entries(mod)) {
        if (/^[A-Z]/.test(name) && typeof val === 'function') out[name] = val;
    }
    return out;
}

const SOURCES = [
    {id: 'lucide', label: 'Lucide', icons: collectLucide()},
    {id: 'fa', label: 'Font Awesome', icons: collectReactIcons(FontAwesome)},
    {id: 'md', label: 'Material', icons: collectReactIcons(Material)},
    {id: 'bs', label: 'Bootstrap', icons: collectReactIcons(Bootstrap)},
];

export const ICONS = {};      // name -> component
export const ICON_LIB = {};   // name -> library id
for (const s of SOURCES) {
    for (const [name, cmp] of Object.entries(s.icons)) {
        if (!ICONS[name]) {
            ICONS[name] = cmp;
            ICON_LIB[name] = s.id;
        }
    }
}

export const ICON_NAMES = Object.keys(ICONS).sort((a, b) => a.localeCompare(b));
export const ICON_LIBRARIES = SOURCES.map(s => ({id: s.id, label: s.label}));

export function DynamicIcon({name, ...props}) {
    const Cmp = ICONS[name] || ICONS.Star;
    return <Cmp {...props}/>;
}
