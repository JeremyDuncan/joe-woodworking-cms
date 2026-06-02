// Analyse which pages link to which, so the admin can see a page's status
// (in the nav bar / linked from somewhere / unlinked) and "what links here".

// Internal (/path) link targets found in a rich-text HTML string.
function targetsFromHtml(html) {
    if (typeof html !== 'string') return [];
    const out = [];
    const re = /href\s*=\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(html))) if (m[1].startsWith('/')) out.push(m[1]);
    return out;
}

// All internal link targets a single block points at: block-level `to`, inline links in
// `html`, and per-item links inside lists.
function targetsFromBlock(b) {
    const p = b.props || {};
    const out = [];
    if (typeof p.to === 'string' && p.to.startsWith('/')) out.push(p.to);
    out.push(...targetsFromHtml(p.html));
    if (b.type === 'list' && Array.isArray(p.items)) {
        for (const raw of p.items) {
            const it = typeof raw === 'string' ? {} : (raw || {});
            if (typeof it.to === 'string' && it.to.startsWith('/')) out.push(it.to);
            out.push(...targetsFromHtml(it.html));
        }
    }
    return out;
}

function routeLabel(route, nav) {
    if (route === '__footer__') return 'Footer';
    const n = (nav || []).find(x => x.path === route);
    return n?.label || (route === '/' ? 'Home' : route);
}

// Map of targetPath -> [{route, label}] — every page (and the footer) that links to it.
// Self-links are ignored.
export function buildLinkSources(layout, nav) {
    const acc = {}; // target -> Map(route -> label)
    for (const route of Object.keys(layout || {})) {
        const targets = new Set();
        for (const b of (layout[route]?.blocks || [])) for (const t of targetsFromBlock(b)) targets.add(t);
        for (const t of targets) {
            if (t === route) continue;
            (acc[t] ||= new Map()).set(route, routeLabel(route, nav));
        }
    }
    const out = {};
    for (const [t, m] of Object.entries(acc)) out[t] = [...m].map(([route, label]) => ({route, label}));
    return out;
}

// 'navigation' (shown in the nav bar) | 'linked' (some page links to it) | 'unlinked'.
export function pageStatus(page, linkSources) {
    if (!page.hidden) return 'navigation';
    return (linkSources[page.path]?.length) ? 'linked' : 'unlinked';
}
