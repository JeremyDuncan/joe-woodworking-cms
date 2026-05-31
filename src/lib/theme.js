// Font family options. Inter is already loaded via styles.css; the rest are
// loaded on demand from Google Fonts the first time they're selected.
export const FONTS = {
    'Inter': "'Inter', system-ui, -apple-system, Segoe UI, sans-serif",
    'Poppins': "'Poppins', system-ui, sans-serif",
    'Montserrat': "'Montserrat', sans-serif",
    'Raleway': "'Raleway', sans-serif",
    'Work Sans': "'Work Sans', sans-serif",
    'DM Sans': "'DM Sans', sans-serif",
    'Nunito': "'Nunito', sans-serif",
    'Lato': "'Lato', sans-serif",
    'Oswald': "'Oswald', sans-serif",
    'Bebas Neue': "'Bebas Neue', 'Oswald', sans-serif",
    'Merriweather': "'Merriweather', Georgia, serif",
    'Playfair Display': "'Playfair Display', Georgia, serif",
    'Lora': "'Lora', Georgia, serif",
    'Roboto Mono': "'Roboto Mono', ui-monospace, monospace",
};

const FONT_HREF = {
    'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap',
    'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap',
    'Raleway': 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&display=swap',
    'Work Sans': 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700;800;900&display=swap',
    'DM Sans': 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap',
    'Nunito': 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap',
    'Lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap',
    'Oswald': 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap',
    'Bebas Neue': 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
    'Merriweather': 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&display=swap',
    'Playfair Display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&display=swap',
    'Lora': 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap',
    'Roboto Mono': 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap',
};

export const defaultTheme = {
    font: 'Inter',
    headerSolid: false,         // false = translucent (blurred); true = solid header color
    colors: {
        background: '#08111f',  // base page color
        gradient1: '#b51f2b',   // top-left glow
        gradient2: '#2458a3',   // top-right glow
        gradient3: '#08111f',   // bottom-left glow (off by default)
        gradient4: '#08111f',   // bottom-right glow (off by default)
        button: '#e33445',      // button fill
        icon: '#d7a64f',        // icon color
        hover: '#d7a64f',       // card hover border / highlight
        header: '#0b1626',      // header bar color (used when headerSolid)
    },
    text: {
        heading: '#fffaf0',
        paragraph: '#b8c2d6',
        nav: '#fffaf0',
        button: '#ffffff',
        eyebrow: '#d7a64f',
        list: '#f4ead8',
        featured: '#d7a64f',
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

function rgbOf(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
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
    const c = {...defaultTheme.colors, ...(theme?.colors || {})};
    const tx = {...defaultTheme.text, ...((theme?.text && typeof theme.text === 'object' && !Array.isArray(theme.text)) ? theme.text : {})};
    const hx = (v, fb) => validHex(v, fb);
    const root = document.documentElement.style;

    const background = hx(c.background, defaultTheme.colors.background);
    const button = hx(c.button, defaultTheme.colors.button);
    const bgDeep = shade(background, -0.5);
    root.setProperty('--navy', background);
    root.setProperty('--navy-2', shade(background, 0.08));
    root.setProperty('--bg-deep', bgDeep);
    root.setProperty('--bg-deep-rgb', rgbOf(bgDeep));

    // Background corner gradients
    root.setProperty('--grad1-rgb', rgbOf(hx(c.gradient1, defaultTheme.colors.gradient1)));
    root.setProperty('--grad2-rgb', rgbOf(hx(c.gradient2, defaultTheme.colors.gradient2)));
    root.setProperty('--grad3-rgb', rgbOf(hx(c.gradient3, defaultTheme.colors.gradient3)));
    root.setProperty('--grad4-rgb', rgbOf(hx(c.gradient4, defaultTheme.colors.gradient4)));

    // Buttons (legacy --red* kept in sync for any remaining references)
    root.setProperty('--btn', button);
    root.setProperty('--btn-deep', shade(button, -0.4));
    root.setProperty('--btn-rgb', rgbOf(button));
    root.setProperty('--red-bright', button);
    root.setProperty('--red', shade(button, -0.18));

    root.setProperty('--icon-color', hx(c.icon, defaultTheme.colors.icon));
    root.setProperty('--hover-border', hx(c.hover, defaultTheme.colors.hover));

    // Header: solid color, or the default translucent (blurred) gradient.
    if (theme?.headerSolid) {
        const header = hx(c.header, defaultTheme.colors.header);
        root.setProperty('--header-bg', header);
        root.setProperty('--header-blur', 'none');
    } else {
        root.setProperty('--header-bg',
            `linear-gradient(180deg, rgba(${rgbOf(bgDeep)}, .92), rgba(${rgbOf(bgDeep)}, .5))`);
        root.setProperty('--header-blur', 'blur(14px)');
    }

    // Per-element text colors
    root.setProperty('--t-heading', hx(tx.heading, defaultTheme.text.heading));
    root.setProperty('--t-paragraph', hx(tx.paragraph, defaultTheme.text.paragraph));
    root.setProperty('--t-nav', hx(tx.nav, defaultTheme.text.nav));
    root.setProperty('--t-button', hx(tx.button, defaultTheme.text.button));
    root.setProperty('--t-eyebrow', hx(tx.eyebrow, defaultTheme.text.eyebrow));
    root.setProperty('--t-list', hx(tx.list, defaultTheme.text.list));
    root.setProperty('--t-featured', hx(tx.featured, defaultTheme.text.featured));

    const font = theme?.font && FONTS[theme.font] ? theme.font : 'Inter';
    ensureFont(font);
    root.setProperty('--app-font', FONTS[font]);
}
