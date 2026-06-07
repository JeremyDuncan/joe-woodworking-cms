import React from 'react';

// Consistent header for every admin dashboard section: a gold icon, a title, and an optional
// one-line description — so all the tabs look like part of the same dashboard.
export function SectionHeader({icon: Icon, title, children}) {
    return <div className="dash-head">
        <h2 className="dash-head-title">{Icon && <Icon size={18}/>} {title}</h2>
        {children && <p className="dash-head-intro">{children}</p>}
    </div>;
}
