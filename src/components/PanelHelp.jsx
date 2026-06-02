import React, {useState} from 'react';
import {createPortal} from 'react-dom';
import {Info, X} from 'lucide-react';

const HELP = {
    pages: {
        title: 'Pages',
        items: [
            'Use this panel to find and open any page on the site.',
            'A page named pizza/pie-patterns appears inside a pizza section. The page itself shows as pie-patterns.',
            'Sections stay closed until you open them, search for a page inside them, or use the expand button.',
            'Navigation means the page is in the top menu. Linked means another page points to it. Unlinked means it is hidden and nothing points to it.'
        ]
    },
    nav: {
        title: 'Navigation',
        items: [
            'These are the pages shown in the top menu.',
            'Use the arrows to change menu order.',
            'Use the eye button to remove a page from the menu without deleting the page.',
            'Add Nav link lets you choose hidden pages. Sectioned pages are grouped by the part before the slash.'
        ]
    },
    templates: {
        title: 'Page Templates',
        items: [
            'Templates are saved page layouts you can apply to the current page.',
            'Choosing a template changes only the draft page until you save.',
            'Revert selection restores the page to the layout it had before you chose a template.',
            'Update changes the saved template itself, so use it only when you want that template to change everywhere it is reused later.'
        ]
    },
    theme: {
        title: 'Theme',
        items: [
            'Theme controls the site-wide colors, font, header style, and text colors.',
            'Apply preset loads a saved theme into the current draft.',
            'Save as new creates a reusable theme preset.',
            'Update changes the selected saved theme preset.'
        ]
    }
};

function HelpModal({help, onClose}) {
    return createPortal(
        <div className="dialog-backdrop" onMouseDown={onClose}>
            <div className="dialog panel-help-modal" onMouseDown={e => e.stopPropagation()}>
                <div className="panel-help-head">
                    <strong><Info size={18}/> {help.title}</strong>
                    <button type="button" className="theme-close" onClick={onClose}><X size={16}/></button>
                </div>
                <ul className="panel-help-list">
                    {help.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>
        </div>, document.body);
}

export function PanelHelp({topic}) {
    const [open, setOpen] = useState(false);
    const help = HELP[topic];
    if (!help) return null;
    return <>
        <button type="button" className="panel-icon-action" title={`About ${help.title}`}
                onMouseDown={e => e.stopPropagation()}
                onClick={() => setOpen(true)}>
            <Info size={16}/>
        </button>
        {open && <HelpModal help={help} onClose={() => setOpen(false)}/>}
    </>;
}
