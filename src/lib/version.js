// The iterative version shown to admins, e.g. "v0.021".
// MAJOR comes from package.json (injected by Vite as __APP_VERSION__ at build time); the
// running number is a server-side revision counter bumped on every save.
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

export function siteVersion(rev) {
    const major = APP_VERSION.split('.')[0] || '0';
    const n = Math.max(0, Math.floor(Number(rev) || 0));
    return `v${major}.${String(n).padStart(3, '0')}`;
}
