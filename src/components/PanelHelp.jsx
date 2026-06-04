import React, {useState} from 'react';
import {createPortal} from 'react-dom';
import {Info, X} from 'lucide-react';

const HELP = {
    pages: {
        title: 'Pages',
        items: [
            'This panel lists every page and lets you create new ones. Click a page to open it.',
            'Navigation (at the top) groups the pages currently in your menu. All other pages are grouped by section.',
            'Use the page icon (+) to add a page, and the folder icon to add a section.',
            'Each section has its own + button — adding a page there files it automatically as section/your-page (e.g. menu/pizza).',
            'Use the move icon on any page to file it into a section (or remove it from one); links pointing to that page update automatically.',
            'A page named pizza/pie-patterns lives in the pizza section and shows as pie-patterns.',
            'The badge shows navigation (in the menu), linked (another page points to it), or unlinked (hidden and not linked).'
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
