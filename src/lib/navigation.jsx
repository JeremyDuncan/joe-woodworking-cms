import React from 'react';

export function navigate(path) {
    history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
    scrollTo({top: 0, behavior: 'smooth'});
}

export function Link({to, children, className}) {
    return <a href={to} className={className} onClick={e => {
        e.preventDefault();
        navigate(to)
    }}>{children}</a>;
}
