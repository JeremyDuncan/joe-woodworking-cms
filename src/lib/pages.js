// Helpers for page paths, sections, and grouping.

// Turn a typed name/path into a clean path. Slashes are kept so pages can live in
// sections, e.g. "Menu / Pizza" or "menu/pizza" -> "/menu/pizza".
export function slugifyPath(raw) {
    return '/' + String(raw || '').trim().toLowerCase()
        .replace(/^\/+/, '')
        .replace(/\s*\/\s*/g, '/')   // tidy spaces around section separators
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9/_-]+/g, '')
        .replace(/\/+/g, '/')
        .replace(/(^[-/]+)|([-/]+$)/g, '');
}

// The last path segment — used as the default nav label so "/menu/pizza" shows "pizza".
export function lastSegment(path) {
    const segs = String(path || '').replace(/^\//, '').split('/').filter(Boolean);
    return segs[segs.length - 1] || (path || '');
}

export function isSectionedPath(path) {
    return String(path || '').replace(/^\//, '').split('/').filter(Boolean).length > 1;
}

export function pageLabel(page) {
    if (!page) return '';
    return isSectionedPath(page.path) ? lastSegment(page.path) : (page.label || lastSegment(page.path));
}

// The section a page belongs to (its first path segment), or null for top-level pages.
export function sectionOf(path) {
    const segs = String(path || '').replace(/^\//, '').split('/').filter(Boolean);
    return segs.length > 1 ? segs[0] : null;
}

// Order-insensitive deep stringify: equal content compares equal regardless of the order
// keys happened to be serialized in (the server merges defaults into layout pages, which
// can reorder their keys relative to a published snapshot of the same content).
function stable(v) {
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    if (v && typeof v === 'object') {
        return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
    }
    return JSON.stringify(v);
}

// True when two page layouts have the same content — used to tell "published" from "edited".
export function samePage(a, b) {
    return stable(a) === stable(b);
}

// Split a list of pages into top-level `roots` and a `sections` map (section -> pages).
export function groupPages(pages) {
    const roots = [];
    const sections = {};
    for (const p of (pages || [])) {
        const sec = sectionOf(p.path);
        if (sec) (sections[sec] ||= []).push(p);
        else roots.push(p);
    }
    return {roots, sections};
}
