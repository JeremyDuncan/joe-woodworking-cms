import {defaultTheme} from '../lib/theme.js';

export const fallbackGallery = [
    {
        title: 'Project One',
        description: 'A short description of this project goes here.',
        price: '',
        media: [{url: '/placeholder.webp', type: 'image/webp'}]
    },
    {
        title: 'Project Two',
        description: 'A short description of this project goes here.',
        price: '',
        media: [{url: '/placeholder.webp', type: 'image/webp'}]
    },
    {
        title: 'Project Three',
        description: 'A short description of this project goes here.',
        price: '',
        media: [{url: '/placeholder.webp', type: 'image/webp'}]
    }
];

// Default block layout for the home page: a 2-column hero (copy on the left,
// featured image on the right). Each block carries its own content in `props`.
// Default home layout: a centered stack with the two CTAs side-by-side. Blocks
// flow in order across `columns`; props.span lets a block span multiple columns.
export const defaultHomeLayout = {
    columns: 2,
    blocks: [
        {id: 'home-eyebrow', type: 'eyebrow', props: {text: 'Welcome', icon: 'Sparkles', span: 2}},
        {
            id: 'home-heading', type: 'heading',
            props: {text: 'A beautiful website you can edit yourself.', level: 1, span: 2}
        },
        {
            id: 'home-body', type: 'text',
            props: {text: 'This is a starter template. Click anything to edit it, rearrange the blocks, choose your colors, and make it your own — no code required.', span: 2}
        },
        {
            id: 'home-cta1', type: 'button',
            props: {label: 'Get in touch', to: '/contact', variant: 'primary', icon: 'ArrowRight'}
        },
        {id: 'home-cta2', type: 'button', props: {label: 'See our work', to: '/gallery', variant: 'ghost'}},
        {
            id: 'home-proof', type: 'list',
            props: {items: [{text: 'Fully editable pages', icon: 'Pencil'}, {text: 'Your own colors & fonts', icon: 'Palette'}, {text: 'Looks great on phones & desktops', icon: 'Check'}], icon: 'BadgeCheck', span: 2}
        },
        {id: 'home-image', type: 'image', props: {url: '/build-your-site.webp', caption: 'Replace this with your own image', span: 2}},
        {id: 'home-divider', type: 'divider', props: {span: 2}},
        {id: 'home-h2', type: 'heading', props: {text: 'What we do', level: 2, span: 2}},
        {id: 'home-h2-body', type: 'text', props: {text: 'Briefly describe what your business offers and why people should choose you.', span: 2}},
        {id: 'home-learn', type: 'button', props: {label: 'Learn more about us', to: '/about', variant: 'link', icon: ''}}
    ]
};

export const defaultSettings = {
    brandName: 'Your Business', brandShort: 'Your Brand', brandIcon: 'Hexagon',
    email: 'hello@example.com', phone: '(555) 123-4567',
    nav: [{label: 'Tutorial', path: '/tutorial', icon: 'GraduationCap'}, {label: 'Home', path: '/'},
        {label: 'Services', path: '/services'}, {label: 'Gallery', path: '/gallery'},
        {label: 'About', path: '/about'}, {label: 'Contact', path: '/contact', cta: true}],
    layout: {
        '/': defaultHomeLayout,
        '/services': {
            columns: 1,
            blocks: [
                {id: 'srv-eyebrow', type: 'eyebrow', props: {text: 'What we offer', icon: 'Star'}},
                {id: 'srv-heading', type: 'heading', props: {text: 'Services', level: 1}},
                {id: 'srv-body', type: 'text', props: {text: 'A short introduction to the services your business provides.'}},
                {id: 'srv-list', type: 'list', props: {items: [{text: 'Service one — a short description', icon: 'Check'}, {text: 'Service two — a short description', icon: 'Check'}, {text: 'Service three — a short description', icon: 'Check'}], icon: 'BadgeCheck'}},
                {id: 'srv-divider', type: 'divider', props: {}},
                {id: 'srv-cta-h', type: 'heading', props: {text: 'Ready to get started?', level: 3}},
                {id: 'srv-cta-b', type: 'text', props: {text: 'Tell us what you need and we’ll take it from there.'}},
                {id: 'srv-cta', type: 'button', props: {label: 'Contact us', to: '/contact', variant: 'primary', icon: 'ArrowRight'}}
            ]
        },
        '/gallery': {
            columns: 3,
            blocks: [
                {id: 'gal-eyebrow', type: 'eyebrow', props: {text: 'Our work', icon: 'Image', span: 3}},
                {id: 'gal-heading', type: 'heading', props: {text: 'Gallery', level: 1, span: 3}},
                {id: 'gal-body', type: 'text', props: {text: 'A selection of recent projects. Replace these examples with your own.', span: 3}},
                {id: 'gal-1', type: 'work', props: {title: 'Project One', price: '', description: 'A short description of this project.', image: '/placeholder.webp'}},
                {id: 'gal-2', type: 'work', props: {title: 'Project Two', price: '', description: 'A short description of this project.', image: '/placeholder.webp'}},
                {id: 'gal-3', type: 'work', props: {title: 'Project Three', price: '', description: 'A short description of this project.', image: '/placeholder.webp'}}
            ]
        },
        '/about': {
            columns: 2,
            blocks: [
                {id: 'abt-eyebrow', type: 'eyebrow', props: {text: 'Our story', icon: 'BookOpen', span: 2}},
                {id: 'abt-heading', type: 'heading', props: {text: 'About us', level: 1, span: 2}},
                {id: 'abt-body', type: 'text', props: {text: 'Tell your story here — who you are, what you value, and why customers choose you.'}},
                {id: 'abt-image', type: 'image', props: {url: '/placeholder.webp', caption: ''}},
                {id: 'abt-divider', type: 'divider', props: {span: 2}},
                {id: 'abt-values-h', type: 'heading', props: {text: 'What we value', level: 3, span: 2}},
                {id: 'abt-values', type: 'list', props: {items: [{text: 'Quality work', icon: 'BadgeCheck'}, {text: 'Honest service', icon: 'Heart'}, {text: 'Real craftsmanship', icon: 'Hammer'}], icon: 'Star', span: 2}}
            ]
        },
        '/contact': {
            columns: 1,
            blocks: [
                {id: 'con-eyebrow', type: 'eyebrow', props: {text: 'Get in touch', icon: 'Mail'}},
                {id: 'con-heading', type: 'heading', props: {text: 'Contact', level: 1}},
                {id: 'con-body', type: 'text', props: {text: 'We’d love to hear from you. Reach out and we’ll get back to you soon.'}},
                {id: 'con-list', type: 'list', props: {items: [{text: 'hello@example.com', icon: 'Mail'}, {text: '(555) 123-4567', icon: 'Phone'}], icon: 'Mail'}},
                {id: 'con-cta', type: 'button', props: {label: 'Email us', to: 'mailto:hello@example.com', variant: 'primary', icon: 'Send'}}
            ]
        },
        // Built-in admin tutorial. Shows in the nav on a fresh install; hide it
        // (Pages → uncheck Nav) or delete it once you know your way around.
        '/tutorial': {
            columns: 1,
            blocks: [
                {id: 'tut-eyebrow', type: 'eyebrow', props: {text: 'Admin guide', icon: 'GraduationCap'}},
                {id: 'tut-h1', type: 'heading', props: {text: 'How to run your website', level: 1}},
                {id: 'tut-intro', type: 'text', props: {text: 'Welcome! This page explains everything you can do as the site admin, with live examples. When you’re comfortable, hide this page from the menu (Pages → uncheck “Nav”) or delete it entirely.'}},

                {id: 'tut-edit-h', type: 'heading', props: {text: '1 · Edit mode', level: 2}},
                {id: 'tut-edit-b', type: 'text', props: {text: 'Sign in at your private admin address and click “Edit site”. A toolbar appears with Pages, Theme, Save, and Discard. Every change is a draft until you press Save.'}},
                {id: 'tut-edit-l', type: 'list', props: {icon: 'BadgeCheck', items: [
                    {text: 'Click any text or icon on the page to change it', icon: 'Pencil'},
                    {text: 'Save — the green button — makes your changes live', icon: 'BadgeCheck'},
                    {text: 'Discard throws away unsaved changes (it asks first)', icon: 'Trash2'}
                ]}},

                {id: 'tut-text-h', type: 'heading', props: {text: '2 · Editing text & icons', level: 2}},
                {id: 'tut-text-b', type: 'text', props: {text: 'In edit mode, click directly on any heading, paragraph, label, or list item and start typing. Click any icon to open the picker and choose a new one.'}},
                {id: 'tut-text-link-h', type: 'heading', props: {text: 'Links inside text', level: 3}},
                {id: 'tut-text-link-b', type: 'text', props: {text: 'Select any words inside a heading or paragraph and a small bar appears. Pick a page to link to, or choose “External…” to link to another website — external links always open in a new tab.'}},

                {id: 'tut-blocks-h', type: 'heading', props: {text: '3 · Building pages with blocks', level: 2}},
                {id: 'tut-blocks-b', type: 'text', props: {text: 'Every page is built from blocks. Choose a 1, 2, or 3 column grid with the “Columns” buttons, drag the ⠿ handle to reorder, set each block’s Width to span columns, and press × to remove one. Add new blocks from the “Add:” row.'}},
                {id: 'tut-blocks-l', type: 'list', props: {icon: 'Star', items: [
                    {text: 'Eyebrow — a small label with an icon', icon: 'Star'},
                    {text: 'Heading — H1 through H6, or a paragraph', icon: 'Bookmark'},
                    {text: 'Paragraph — body text with inline links', icon: 'BookOpen'},
                    {text: 'Button — primary, ghost, or text-link style', icon: 'ArrowRight'},
                    {text: 'List — bullet items, each with its own icon', icon: 'Check'},
                    {text: 'Image — upload, crop, caption, and link it', icon: 'Image'},
                    {text: 'Item — a card that also appears on your dashboard', icon: 'Package'},
                    {text: 'Divider — a horizontal line', icon: 'Ruler'},
                    {text: 'Copyright — shows the current year automatically', icon: 'Calendar'}
                ]}},

                {id: 'tut-ex-h', type: 'heading', props: {text: 'Live examples', level: 2}},
                {id: 'tut-ex-b', type: 'text', props: {text: 'The blocks below are real and editable. In edit mode, click any of them to see their controls.'}},
                {id: 'tut-ex-eyebrow', type: 'eyebrow', props: {text: 'This is an eyebrow', icon: 'Sparkles'}},
                {id: 'tut-ex-h3', type: 'heading', props: {text: 'This is an H3 heading', level: 3}},
                {id: 'tut-ex-text', type: 'text', props: {text: 'This is a paragraph block — try selecting these words to turn them into a link.'}},
                {id: 'tut-ex-btn', type: 'button', props: {label: 'Primary button', to: '/contact', variant: 'primary', icon: 'ArrowRight'}},
                {id: 'tut-ex-btn2', type: 'button', props: {label: 'Text link', to: '/gallery', variant: 'link', icon: ''}},
                {id: 'tut-ex-list', type: 'list', props: {icon: 'BadgeCheck', items: [
                    {text: 'A list item with its own icon', icon: 'BadgeCheck'},
                    {text: 'Another item', icon: 'Star'}
                ]}},
                {id: 'tut-ex-divider', type: 'divider', props: {}},
                {id: 'tut-ex-item', type: 'work', props: {title: 'Example item', price: 'Custom quote', description: 'Items show here and in your dashboard’s Itemtab. Add a picture, set a price, and link the whole card to a page.', image: '/placeholder.webp'}},

                {id: 'tut-pages-h', type: 'heading', props: {text: '4 · Pages', level: 2}},
                {id: 'tut-pages-b', type: 'text', props: {text: 'Open “Pages” in the toolbar to add, rename, reorder, or remove pages. Each page has these options:'}},
                {id: 'tut-pages-l', type: 'list', props: {icon: 'Folder', items: [
                    {text: 'Nav — show or hide the page in the top menu', icon: 'Eye'},
                    {text: 'Btn — style its menu link as a call-to-action button', icon: 'ArrowRight'},
                    {text: 'Path — the page’s web address, e.g. /about', icon: 'Link'},
                    {text: 'Layout templates — save a layout and reuse it on other pages', icon: 'Folder'}
                ]}},

                {id: 'tut-theme-h', type: 'heading', props: {text: '5 · Theme & colors', level: 2}},
                {id: 'tut-theme-b', type: 'text', props: {text: 'Open “Theme” to change the font; the background and its four corner glows; the button, icon, and divider colors; the card hover border; and every text color. The header can be translucent or a solid color. Save favorite combinations as named presets to reuse later.'}},

                {id: 'tut-hf-h', type: 'heading', props: {text: '6 · Header & footer', level: 2}},
                {id: 'tut-hf-b', type: 'text', props: {text: 'Your brand name, brand icon, and menu links live in the header and are edited in place. The footer at the bottom appears on every page and is edited just like a page. On phones the menu collapses into a ☰ button.'}},

                {id: 'tut-dash-h', type: 'heading', props: {text: '7 · The dashboard', level: 2}},
                {id: 'tut-dash-b', type: 'text', props: {text: 'Your private dashboard has three tabs: Item(add and manage items with photos or videos), Password (change your login), and Backup.'}},

                {id: 'tut-backup-h', type: 'heading', props: {text: '8 · Backups — important!', level: 2}},
                {id: 'tut-backup-b', type: 'text', props: {text: 'In the dashboard’s Backup tab, click “Download backup” to save one .zip containing every page, template, theme, item, image, and admin login. Keep it somewhere safe, off the server. If anything is ever lost, “Restore from backup” rebuilds the entire site from that file — even onto brand-new, empty storage. Download a fresh backup regularly.'}},

                {id: 'tut-end-h', type: 'heading', props: {text: 'You’re ready', level: 2}},
                {id: 'tut-end-b', type: 'text', props: {text: 'That’s everything. When you no longer need this guide, open Pages and uncheck “Nav” to hide it, or delete the page. Don’t forget to press Save.'}}
            ]
        },
        // Global footer (rendered on every page, like the header). Edit it from any page.
        '__footer__': {
            columns: 3,
            blocks: [
                {id: 'foot-brand', type: 'heading', props: {text: 'Your Business', level: 3}},
                {id: 'foot-tag', type: 'text', props: {text: 'A short tagline describing what your business does.'}},
                {id: 'foot-explore-h', type: 'heading', props: {text: 'Explore', level: 3}},
                {id: 'foot-link1', type: 'button', props: {label: 'Services', to: '/services', variant: 'link', icon: ''}},
                {id: 'foot-link2', type: 'button', props: {label: 'Gallery', to: '/gallery', variant: 'link', icon: ''}},
                {id: 'foot-link3', type: 'button', props: {label: 'Contact', to: '/contact', variant: 'link', icon: ''}},
                {id: 'foot-contact-h', type: 'heading', props: {text: 'Get in touch', level: 3}},
                {id: 'foot-contact', type: 'list', props: {items: [{text: 'hello@example.com', icon: 'Mail'}, {text: '(555) 123-4567', icon: 'Phone'}], icon: 'Mail'}},
                {id: 'foot-copy', type: 'copyright', props: {text: 'Your Business. All rights reserved.', span: 3}}
            ]
        }
    },
    layouts: {},
    theme: defaultTheme,
    themes: {},
    home: {
        eyebrow: 'Welcome',
        title: 'A beautiful website you can edit yourself.',
        body: 'This is a starter template you can make your own.',
        primaryCta: 'Get in touch',
        secondaryCta: 'See our work'
    },
    proof: ['Fully editable pages', 'Your own colors & fonts', 'Mobile friendly'],
    work: {
        eyebrow: 'Our work',
        title: 'Gallery',
        body: 'A selection of recent projects.'
    },
    options: {
        eyebrow: 'What we offer',
        title: 'Services',
        body: 'A short introduction to the services your business provides.',
        items: ['Service one', 'Service two', 'Service three']
    },
    process: {
        eyebrow: 'How it works',
        title: 'Our process',
        steps: [{
            title: 'Step one',
            body: 'Describe the first step of working with you.'
        }, {
            title: 'Step two',
            body: 'Describe the second step of working with you.'
        }, {
            title: 'Step three',
            body: 'Describe the third step of working with you.'
        }]
    },
    contact: {
        eyebrow: 'Get in touch',
        title: 'Contact',
        body: 'We’d love to hear from you. Reach out and we’ll get back to you soon.'
    }
};

export function mergeSettings(s) {
    return {
        ...defaultSettings, ...(s || {}),
        layout: {...defaultSettings.layout, ...(s?.layout || {})},
        layouts: s?.layouts || {},
        theme: {
            ...defaultTheme, ...(s?.theme || {}),
            colors: {...defaultTheme.colors, ...(s?.theme?.colors || {})},
            text: {
                ...defaultTheme.text,
                ...((s?.theme?.text && typeof s.theme.text === 'object' && !Array.isArray(s.theme.text)) ? s.theme.text : {})
            }
        },
        themes: s?.themes || {},
        home: {...defaultSettings.home, ...(s?.home || {})},
        work: {...defaultSettings.work, ...(s?.work || {})},
        options: {...defaultSettings.options, ...(s?.options || {})},
        process: {...defaultSettings.process, ...(s?.process || {})},
        contact: {...defaultSettings.contact, ...(s?.contact || {})}
    };
}
