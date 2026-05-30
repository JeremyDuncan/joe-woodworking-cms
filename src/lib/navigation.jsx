import React from 'react';

export function navigate(path) {
    history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
    scrollTo({top: 0, behavior: 'smooth'});
}

export function Link({to, children, className}) {
    return <a href={to} className={className} onClick={e => {
        // Let the browser handle modified clicks (new tab/window) and non-primary buttons.
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to)
    }}>{children}</a>;
}
