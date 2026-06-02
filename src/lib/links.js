// Analyse which pages link to which, so the admin can see a page's status
// (in the nav bar / linked from somewhere / unlinked) and "what links here".
import {pageLabel} from './pages.js';

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
    return pageLabel(n) || (route === '/' ? 'Home' : route);
}

function unlinkHtmlTarget(html, target) {
    if (typeof html !== 'string' || !target) return html;
    if (typeof DOMParser === 'undefined') {
        const esc = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return html.replace(new RegExp(`<a\\b([^>]*\\s)?href=["']${esc}["'][^>]*>(.*?)<\\/a>`, 'gi'), '$2');
    }
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    const root = doc.body.firstChild;
    root.querySelectorAll('a').forEach(a => {
        if ((a.getAttribute('href') || '') !== target) return;
        const parent = a.parentNode;
        while (a.firstChild) parent.insertBefore(a.firstChild, a);
        parent.removeChild(a);
    });
    return root.innerHTML;
}

function unlinkBlockTarget(block, target) {
    const props = block.props || {};
    let nextProps = props;
    const patch = change => {
        if (nextProps === props) nextProps = {...props};
        Object.assign(nextProps, change);
    };
    if (props.to === target) patch({to: ''});
    if (typeof props.html === 'string') {
        const html = unlinkHtmlTarget(props.html, target);
        if (html !== props.html) patch({html});
    }
    if (block.type === 'list' && Array.isArray(props.items)) {
        let changed = false;
        const items = props.items.map(raw => {
            if (typeof raw === 'string') return raw;
            const item = raw || {};
            let next = item;
            if (item.to === target) {
                next = {...next, to: ''};
                changed = true;
            }
            if (typeof item.html === 'string') {
                const html = unlinkHtmlTarget(item.html, target);
                if (html !== item.html) {
                    next = next === item ? {...item} : next;
                    next.html = html;
                    changed = true;
                }
            }
            return next;
        });
        if (changed) patch({items});
    }
    return nextProps === props ? block : {...block, props: nextProps};
}

export function unlinkLayoutTarget(layout, target) {
    const next = {};
    for (const [route, page] of Object.entries(layout || {})) {
        const blocks = (page?.blocks || []).map(b => unlinkBlockTarget(b, target));
        next[route] = {...page, blocks};
    }
    return next;
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
