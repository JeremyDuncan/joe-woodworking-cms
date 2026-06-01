import React from 'react';

export function navigate(path) {
    history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
    scrollTo({top: 0, behavior: 'smooth'});
}

export function isExternalUrl(to) {
    return /^(https?:\/\/|mailto:|tel:)/i.test(to || '');
}

export function Link({to, children, className}) {
    // External links (and mail/tel) leave the SPA: open web URLs in a new tab.
    if (isExternalUrl(to)) {
        const newTab = /^https?:\/\//i.test(to);
        return <a href={to} className={className}
                  target={newTab ? '_blank' : undefined}
                  rel={newTab ? 'noopener noreferrer' : undefined}>{children}</a>;
    }
    return <a href={to} className={className} onClick={e => {
        // Let the browser handle modified clicks (new tab/window) and non-primary buttons.
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to)
    }}>{children}</a>;
}
