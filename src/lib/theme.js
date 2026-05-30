// Font family options. Inter is already loaded via styles.css; the rest are
// loaded on demand from Google Fonts the first time they're selected.
export const FONTS = {
    'Inter': "'Inter', system-ui, -apple-system, Segoe UI, sans-serif",
    'Poppins': "'Poppins', system-ui, sans-serif",
    'Merriweather': "'Merriweather', Georgia, serif",
    'Playfair Display': "'Playfair Display', Georgia, serif",
    'Roboto Mono': "'Roboto Mono', ui-monospace, monospace",
};

const FONT_HREF = {
    'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap',
    'Merriweather': 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&display=swap',
    'Playfair Display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&display=swap',
    'Roboto Mono': 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap',
};

export const defaultTheme = {
    font: 'Inter',
    colors: {
        accent: '#d7a64f',     // --gold
        primary: '#e33445',    // --red-bright
        background: '#08111f', // --navy
        text: '#fffaf0',       // --white
    }
};

function validHex(h, fallback) {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h || '') ? h : fallback;
}

// Lighten (amt > 0) or darken (amt < 0) a hex color. amt in -1..1.
function shade(hex, amt) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const num = parseInt(h, 16);
    const target = amt < 0 ? 0 : 255;
    const p = Math.abs(amt);
    const ch = shift => {
        const v = (num >> shift) & 255;
        return Math.round((target - v) * p) + v;
    };
    return '#' + [ch(16), ch(8), ch(0)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function ensureFont(name) {
    const href = FONT_HREF[name];
    if (!href || document.querySelector(`link[data-font="${name}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-font', name);
    document.head.appendChild(link);
}

// Apply a theme by setting CSS variables on :root, so every var(--x) updates.
export function applyTheme(theme) {
    if (typeof document === 'undefined') return;
    const colors = {...defaultTheme.colors, ...(theme?.colors || {})};
    const accent = validHex(colors.accent, defaultTheme.colors.accent);
    const primary = validHex(colors.primary, defaultTheme.colors.primary);
    const background = validHex(colors.background, defaultTheme.colors.background);
    const text = validHex(colors.text, defaultTheme.colors.text);
    const root = document.documentElement.style;
    root.setProperty('--gold', accent);
    root.setProperty('--red-bright', primary);
    root.setProperty('--red', shade(primary, -0.18));
    root.setProperty('--navy', background);
    root.setProperty('--navy-2', shade(background, 0.08));
    root.setProperty('--white', text);
    const font = theme?.font && FONTS[theme.font] ? theme.font : 'Inter';
    ensureFont(font);
    root.setProperty('--app-font', FONTS[font]);
}
