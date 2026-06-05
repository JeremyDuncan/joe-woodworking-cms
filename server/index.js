import express from 'express';
import session from 'express-session';
import createFileStore from 'session-file-store';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import {execFile} from 'child_process';
import {promisify} from 'util';
import {randomUUID} from 'crypto';
import fs from 'fs';
import path from 'path';
import {fileURLToPath, pathToFileURL} from 'url';
import os from 'os';
import pkg from 'pg';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    HeadBucketCommand,
    CreateBucketCommand
} from '@aws-sdk/client-s3';
import AdmZip from 'adm-zip';

const {Pool} = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const seedItems = [
    {
        id: randomUUID(),
        title: 'Project One',
        price: '',
        featured: true,
        description: 'A short description of this project goes here. Replace it with your own.',
        media: [{url: '/placeholder.webp', type: 'image/webp', originalName: 'Placeholder'}],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: randomUUID(),
        title: 'Project Two',
        price: '',
        featured: false,
        description: 'A short description of this project goes here. Replace it with your own.',
        media: [{url: '/placeholder.webp', type: 'image/webp', originalName: 'Placeholder'}],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const defaultSettings = {
    brandName: 'Your Business',
    brandShort: 'Your Brand',
    brandIcon: 'Hexagon',
    email: 'hello@example.com',
    phone: '(555) 123-4567',
    nav: [
        {label: 'Guide', path: '/tutorial', icon: 'GraduationCap'},
        {label: 'Home', path: '/'},
        {label: 'Services', path: '/services'},
        {label: 'Gallery', path: '/gallery'},
        {label: 'About', path: '/about'},
        {label: 'Contact', path: '/contact', cta: true},
        {label: 'editing', path: '/tutorial/editing', hidden: true},
        {label: 'blocks', path: '/tutorial/blocks', hidden: true},
        {label: 'columns', path: '/tutorial/columns', hidden: true},
        {label: 'pages', path: '/tutorial/pages', hidden: true},
        {label: 'publishing', path: '/tutorial/publishing', hidden: true},
        {label: 'design', path: '/tutorial/design', hidden: true},
        {label: 'images', path: '/tutorial/images', hidden: true},
        {label: 'backups', path: '/tutorial/backups', hidden: true}
    ],
    layout: {
        '/': {
            columns: 6,
            blocks: [
                {id: 'home-eyebrow', type: 'eyebrow', props: {text: 'Welcome', icon: 'Sparkles', span: 6}},
                {id: 'home-h1', type: 'heading', props: {text: 'A website that grows with your business.', level: 1, span: 6}},
                {id: 'home-lead', type: 'text', props: {text: 'A fast, modern site you can edit yourself — no code and no monthly designer. Click anything to change it, drag blocks into place, and publish when you’re ready.', span: 6}},
                {id: 'home-cta1', type: 'button', props: {label: 'Get started', to: '/contact', variant: 'primary', icon: 'ArrowRight', span: 2}},
                {id: 'home-cta2', type: 'button', props: {label: 'See our work', to: '/gallery', variant: 'ghost', icon: 'Image', span: 2}},
                {id: 'home-cta3', type: 'button', props: {label: 'Read the guide', to: '/tutorial', variant: 'link', icon: 'BookOpen', span: 2}},
                {id: 'home-d1', type: 'divider', props: {span: 6}},
                {id: 'home-why-eb', type: 'eyebrow', props: {text: 'Why choose us', icon: 'Star', span: 6}},
                {id: 'home-why-h', type: 'heading', props: {text: 'Built to make a great first impression.', level: 2, span: 6}},
                {id: 'home-f1-h', type: 'heading', props: {text: 'Fast & modern', level: 3, span: 2}},
                {id: 'home-f2-h', type: 'heading', props: {text: 'Edit it yourself', level: 3, span: 2}},
                {id: 'home-f3-h', type: 'heading', props: {text: 'Works everywhere', level: 3, span: 2}},
                {id: 'home-f1-b', type: 'text', props: {text: 'Loads instantly and looks polished on every device, right out of the box.', span: 2}},
                {id: 'home-f2-b', type: 'text', props: {text: 'Click any text, image, or button to change it — then save when you like it.', span: 2}},
                {id: 'home-f3-b', type: 'text', props: {text: 'Beautiful on phones, tablets, and large desktop screens alike.', span: 2}},
                {id: 'home-d2', type: 'divider', props: {span: 6}},
                {id: 'home-work-eb', type: 'eyebrow', props: {text: 'Our work', icon: 'Image', span: 6}},
                {id: 'home-work-h', type: 'heading', props: {text: 'A look at what we do.', level: 2, span: 6}},
                {id: 'home-work-b', type: 'text', props: {text: 'Browse a few recent projects, then picture yours here.', span: 6}},
                {id: 'home-work-img', type: 'image', props: {url: '/build-your-site.webp', caption: 'Replace this with a photo of your own work', span: 6}},
                {id: 'home-work-cta', type: 'button', props: {label: 'Browse the gallery', to: '/gallery', variant: 'primary', icon: 'ArrowRight', span: 2}},
                {id: 'home-d3', type: 'divider', props: {span: 6}},
                {id: 'home-cta-h', type: 'heading', props: {text: 'Ready to start your project?', level: 2, span: 6}},
                {id: 'home-cta-b', type: 'text', props: {text: 'Tell us what you have in mind and we’ll take it from there.', span: 6}},
                {id: 'home-cta-btn', type: 'button', props: {label: 'Contact us', to: '/contact', variant: 'primary', icon: 'Send', span: 2}}
            ]
        },
        '/services': {
            columns: 6,
            blocks: [
                {id: 'srv-eyebrow', type: 'eyebrow', props: {text: 'What we offer', icon: 'Star', span: 6}},
                {id: 'srv-h1', type: 'heading', props: {text: 'Services', level: 1, span: 6}},
                {id: 'srv-lead', type: 'text', props: {text: 'A short introduction to what your business does and who you help. Replace these three services with your own.', span: 6}},
                {id: 'srv-s1-h', type: 'heading', props: {text: 'Service one', level: 3, span: 2}},
                {id: 'srv-s2-h', type: 'heading', props: {text: 'Service two', level: 3, span: 2}},
                {id: 'srv-s3-h', type: 'heading', props: {text: 'Service three', level: 3, span: 2}},
                {id: 'srv-s1-b', type: 'text', props: {text: 'Describe this service in a sentence or two — what it is and why it helps.', span: 2}},
                {id: 'srv-s2-b', type: 'text', props: {text: 'Describe this service in a sentence or two — what it is and why it helps.', span: 2}},
                {id: 'srv-s3-b', type: 'text', props: {text: 'Describe this service in a sentence or two — what it is and why it helps.', span: 2}},
                {id: 'srv-s1-l', type: 'button', props: {label: 'Ask about this', to: '/contact', variant: 'link', icon: 'ArrowRight', span: 2}},
                {id: 'srv-s2-l', type: 'button', props: {label: 'Ask about this', to: '/contact', variant: 'link', icon: 'ArrowRight', span: 2}},
                {id: 'srv-s3-l', type: 'button', props: {label: 'Ask about this', to: '/contact', variant: 'link', icon: 'ArrowRight', span: 2}},
                {id: 'srv-d1', type: 'divider', props: {span: 6}},
                {id: 'srv-how-eb', type: 'eyebrow', props: {text: 'How it works', icon: 'Workflow', span: 6}},
                {id: 'srv-how-h', type: 'heading', props: {text: 'A simple, clear process', level: 2, span: 6}},
                {id: 'srv-how-l', type: 'list', props: {span: 6, variant: 'plain', size: 'lg', icon: 'Check', items: [{text: 'Get in touch and tell us what you need', icon: 'MessageSquare'}, {text: 'We share a plan and a clear quote', icon: 'ClipboardList'}, {text: 'We do the work and keep you updated', icon: 'Hammer'}, {text: 'You review, we deliver — done right', icon: 'BadgeCheck'}]}},
                {id: 'srv-d2', type: 'divider', props: {span: 6}},
                {id: 'srv-cta-h', type: 'heading', props: {text: 'Ready to get started?', level: 2, span: 6}},
                {id: 'srv-cta', type: 'button', props: {label: 'Contact us', to: '/contact', variant: 'primary', icon: 'ArrowRight', span: 2}}
            ]
        },
        '/gallery': {
            columns: 3,
            blocks: [
                {id: 'gal-eyebrow', type: 'eyebrow', props: {text: 'Our work', icon: 'Image', span: 3}},
                {id: 'gal-h1', type: 'heading', props: {text: 'Gallery', level: 1, span: 3}},
                {id: 'gal-lead', type: 'text', props: {text: 'A selection of recent projects. Replace these with your own photos, titles, and descriptions — each card can link to its own page.', span: 3}},
                {id: 'gal-1', type: 'item', props: {title: 'Project One', price: '', description: 'A short description of this project.', image: '/placeholder.webp'}},
                {id: 'gal-2', type: 'item', props: {title: 'Project Two', price: '', description: 'A short description of this project.', image: '/placeholder.webp'}},
                {id: 'gal-3', type: 'item', props: {title: 'Project Three', price: '', description: 'A short description of this project.', image: '/placeholder.webp'}},
                {id: 'gal-4', type: 'item', props: {title: 'Project Four', price: '', description: 'A short description of this project.', image: '/placeholder.webp'}},
                {id: 'gal-5', type: 'item', props: {title: 'Project Five', price: '', description: 'A short description of this project.', image: '/placeholder.webp'}},
                {id: 'gal-6', type: 'item', props: {title: 'Project Six', price: '', description: 'A short description of this project.', image: '/placeholder.webp'}},
                {id: 'gal-d', type: 'divider', props: {span: 3}},
                {id: 'gal-cta-h', type: 'heading', props: {text: 'Like what you see?', level: 3, span: 3}},
                {id: 'gal-cta', type: 'button', props: {label: 'Start a project', to: '/contact', variant: 'primary', icon: 'ArrowRight', span: 1}}
            ]
        },
        '/about': {
            columns: 6,
            blocks: [
                {id: 'abt-eyebrow', type: 'eyebrow', props: {text: 'Our story', icon: 'BookOpen', span: 6}},
                {id: 'abt-h1', type: 'heading', props: {text: 'About us', level: 1, span: 6}},
                {id: 'abt-body', type: 'text', props: {text: 'Tell your story here — who you are, how you started, what you care about, and why customers choose you. A short, honest paragraph goes a long way.', span: 4}},
                {id: 'abt-img', type: 'image', props: {url: '/placeholder.webp', caption: 'A photo of you or your team', span: 2}},
                {id: 'abt-d1', type: 'divider', props: {span: 6}},
                {id: 'abt-val-eb', type: 'eyebrow', props: {text: 'What we value', icon: 'Heart', span: 6}},
                {id: 'abt-val-h', type: 'heading', props: {text: 'What drives our work', level: 2, span: 6}},
                {id: 'abt-v1-h', type: 'heading', props: {text: 'Quality', level: 3, span: 2}},
                {id: 'abt-v2-h', type: 'heading', props: {text: 'Honesty', level: 3, span: 2}},
                {id: 'abt-v3-h', type: 'heading', props: {text: 'Craft', level: 3, span: 2}},
                {id: 'abt-v1-b', type: 'text', props: {text: 'We sweat the details and take pride in doing things right.', span: 2}},
                {id: 'abt-v2-b', type: 'text', props: {text: 'Clear quotes, honest timelines, and no surprises.', span: 2}},
                {id: 'abt-v3-b', type: 'text', props: {text: 'Real skill and genuine care in everything we make.', span: 2}},
                {id: 'abt-d2', type: 'divider', props: {span: 6}},
                {id: 'abt-cta-h', type: 'heading', props: {text: 'Want to work with us?', level: 2, span: 6}},
                {id: 'abt-cta', type: 'button', props: {label: 'Get in touch', to: '/contact', variant: 'primary', icon: 'ArrowRight', span: 2}}
            ]
        },
        '/contact': {
            columns: 6,
            blocks: [
                {id: 'con-eyebrow', type: 'eyebrow', props: {text: 'Get in touch', icon: 'Mail', span: 6}},
                {id: 'con-h1', type: 'heading', props: {text: 'Contact', level: 1, span: 6}},
                {id: 'con-lead', type: 'text', props: {text: 'We’d love to hear from you. Reach out with the details below and we’ll get back to you soon.', span: 6}},
                {id: 'con-reach-h', type: 'heading', props: {text: 'Reach us', level: 3, span: 3}},
                {id: 'con-next-h', type: 'heading', props: {text: 'What happens next', level: 3, span: 3}},
                {id: 'con-reach-l', type: 'list', props: {span: 3, variant: 'plain', size: 'md', icon: 'Mail', items: [{text: 'hello@example.com', icon: 'Mail'}, {text: '(555) 123-4567', icon: 'Phone'}, {text: '123 Main Street, Your City', icon: 'MapPin'}]}},
                {id: 'con-next-l', type: 'list', props: {span: 3, variant: 'plain', size: 'md', icon: 'Check', items: [{text: 'We read every message ourselves', icon: 'Eye'}, {text: 'You’ll hear back within one business day', icon: 'Clock'}, {text: 'We’ll set up a quick call if it helps', icon: 'Phone'}]}},
                {id: 'con-d', type: 'divider', props: {span: 6}},
                {id: 'con-cta', type: 'button', props: {label: 'Email us', to: 'mailto:hello@example.com', variant: 'primary', icon: 'Send', span: 2}}
            ]
        },
        // Built-in admin guide: a hub page that links to focused topic pages (the tutorial
        // section). Shown in nav on a fresh install; hide or delete it when you're done.
        '/tutorial': {
            columns: 6,
            blocks: [
                {id: 'tut-eyebrow', type: 'eyebrow', props: {text: 'Admin guide', icon: 'GraduationCap', span: 6}},
                {id: 'tut-h1', type: 'heading', props: {text: 'How to run your website', level: 1, span: 6}},
                {id: 'tut-intro', type: 'text', props: {text: 'Welcome! This guide walks through everything you can do as the site admin. Pick a topic below — each page is short and to the point. When you’re comfortable, unpublish or delete this guide from the Pages panel.', span: 6}},
                {id: 'tut-toc-eb', type: 'eyebrow', props: {text: 'Topics', icon: 'BookOpen', span: 6}},
                {id: 'tut-toc', type: 'list', props: {span: 6, variant: 'chips', size: 'lg', icon: 'BookOpen', items: [
                    {text: 'Editing basics — click, save, undo, publish', icon: 'MousePointerClick', to: '/tutorial/editing'},
                    {text: 'Blocks — the building blocks of a page', icon: 'Blocks', to: '/tutorial/blocks'},
                    {text: 'Columns & placement — flexible layouts', icon: 'Columns3', to: '/tutorial/columns'},
                    {text: 'Pages & sections — add and organize pages', icon: 'FileText', to: '/tutorial/pages'},
                    {text: 'Publishing — drafts, publish, unpublish', icon: 'Send', to: '/tutorial/publishing'},
                    {text: 'Design & theme — colors, fonts, header', icon: 'Palette', to: '/tutorial/design'},
                    {text: 'Images & media — upload, crop, position', icon: 'Image', to: '/tutorial/images'},
                    {text: 'Backups — keep your whole site safe', icon: 'Archive', to: '/tutorial/backups'}
                ]}},
                {id: 'tut-d', type: 'divider', props: {span: 6}},
                {id: 'tut-start-h', type: 'heading', props: {text: 'New here? Start with the basics.', level: 2, span: 6}},
                {id: 'tut-start', type: 'button', props: {label: 'Editing basics', to: '/tutorial/editing', variant: 'primary', icon: 'ArrowRight', span: 2}}
            ]
        },
        '/tutorial/editing': {
            columns: 6,
            blocks: [
                {id: 'g-ed-eb', type: 'eyebrow', props: {text: 'Guide · Editing basics', icon: 'MousePointerClick', span: 6}},
                {id: 'g-ed-h1', type: 'heading', props: {text: 'Editing basics', level: 1, span: 6}},
                {id: 'g-ed-intro', type: 'text', props: {text: 'Sign in at your private admin address and click “Edit site”. A toolbar appears at the top with everything you need. Every change is a draft until you save — and only goes live to visitors once you publish.', span: 6}},
                {id: 'g-ed-l', type: 'list', props: {span: 6, variant: 'plain', size: 'md', icon: 'Check', items: [
                    {text: 'Click any text, heading, or label and start typing', icon: 'Pencil'},
                    {text: 'Click an icon to pick a different one', icon: 'Sparkles'},
                    {text: 'Save (green button) keeps your changes', icon: 'BadgeCheck'},
                    {text: 'Undo (↺) steps back through changes before saving', icon: 'RotateCcw'},
                    {text: 'Discard throws away all unsaved changes', icon: 'Trash2'},
                    {text: 'Web view previews the page as visitors will see it', icon: 'Eye'}
                ]}},
                {id: 'g-ed-tip-h', type: 'heading', props: {text: 'Linking text', level: 3, span: 6}},
                {id: 'g-ed-tip-b', type: 'text', props: {text: 'Select words inside any heading or paragraph and a small bar appears — link them to one of your pages, or to another website (which opens in a new tab).', span: 6}},
                {id: 'g-ed-d', type: 'divider', props: {span: 6}},
                {id: 'g-ed-back', type: 'button', props: {label: 'All topics', to: '/tutorial', variant: 'link', icon: 'BookOpen', span: 2}},
                {id: 'g-ed-next', type: 'button', props: {label: 'Next: Blocks', to: '/tutorial/blocks', variant: 'primary', icon: 'ArrowRight', span: 2}}
            ]
        },
        '/tutorial/blocks': {
            columns: 6,
            blocks: [
                {id: 'g-bl-eb', type: 'eyebrow', props: {text: 'Guide · Blocks', icon: 'Blocks', span: 6}},
                {id: 'g-bl-h1', type: 'heading', props: {text: 'Building pages with blocks', level: 1, span: 6}},
                {id: 'g-bl-intro', type: 'text', props: {text: 'Every page is built from blocks. Add them from the “Add:” row, drag the ⠿ handle to reorder, drag a block’s right edge to resize, and press × to remove one.', span: 6}},
                {id: 'g-bl-l', type: 'list', props: {span: 6, variant: 'chips', size: 'md', icon: 'Square', items: [
                    {text: 'Eyebrow — a small label with an icon', icon: 'Star'},
                    {text: 'Heading — H1 to H6, or a paragraph', icon: 'Heading'},
                    {text: 'Paragraph — body text with inline links', icon: 'Pilcrow'},
                    {text: 'Button — primary, ghost, or text-link', icon: 'MousePointerClick'},
                    {text: 'List — items with their own icons and links', icon: 'List'},
                    {text: 'Image — upload, crop, caption, and link', icon: 'Image'},
                    {text: 'Item — a card that also shows in your dashboard', icon: 'LayoutGrid'},
                    {text: 'Divider — a simple horizontal line', icon: 'Minus'},
                    {text: 'Copyright — shows the current year automatically', icon: 'Calendar'}
                ]}},
                {id: 'g-bl-ex-h', type: 'heading', props: {text: 'These are real blocks', level: 3, span: 6}},
                {id: 'g-bl-ex-b', type: 'text', props: {text: 'In edit mode, click the example below to see its controls — every block on every page works the same way.', span: 6}},
                {id: 'g-bl-ex', type: 'item', props: {title: 'Example item', price: 'Custom quote', description: 'Items appear here and in your dashboard’s Item tab. Add a picture, set a price, and link the whole card to a page.', image: '/placeholder.webp', span: 2}},
                {id: 'g-bl-d', type: 'divider', props: {span: 6}},
                {id: 'g-bl-back', type: 'button', props: {label: 'All topics', to: '/tutorial', variant: 'link', icon: 'BookOpen', span: 2}},
                {id: 'g-bl-next', type: 'button', props: {label: 'Next: Columns', to: '/tutorial/columns', variant: 'primary', icon: 'ArrowRight', span: 2}}
            ]
        },
        '/tutorial/columns': {
            columns: 6,
            blocks: [
                {id: 'g-co-eb', type: 'eyebrow', props: {text: 'Guide · Columns & placement', icon: 'Columns3', span: 6}},
                {id: 'g-co-h1', type: 'heading', props: {text: 'Columns & placement', level: 1, span: 6}},
                {id: 'g-co-intro', type: 'text', props: {text: 'Choose a 1–6 column grid for any page with the column buttons in the builder toolbar, then size and place each block within it. This very page uses six columns.', span: 6}},
                {id: 'g-co-s1-h', type: 'heading', props: {text: 'Resize', level: 3, span: 3}},
                {id: 'g-co-s2-h', type: 'heading', props: {text: 'Two placement modes', level: 3, span: 3}},
                {id: 'g-co-s1-b', type: 'text', props: {text: 'Drag a block’s right edge to make it span more columns — from a single column up to the full width.', span: 3}},
                {id: 'g-co-s2-b', type: 'text', props: {text: 'Flow (magnet) lets blocks shift to make room. Free (grid) lets you drop a block into any open cell and it stays put.', span: 3}},
                {id: 'g-co-l', type: 'list', props: {span: 6, variant: 'plain', size: 'md', icon: 'Check', items: [
                    {text: 'Flow mode — blocks rearrange as you drag and resize', icon: 'Magnet'},
                    {text: 'Free mode — place blocks anywhere there’s space', icon: 'LayoutGrid'},
                    {text: 'Guides — overlay column and row lines to line things up', icon: 'Grid3x3'}
                ]}},
                {id: 'g-co-d', type: 'divider', props: {span: 6}},
                {id: 'g-co-back', type: 'button', props: {label: 'All topics', to: '/tutorial', variant: 'link', icon: 'BookOpen', span: 2}},
                {id: 'g-co-next', type: 'button', props: {label: 'Next: Pages', to: '/tutorial/pages', variant: 'primary', icon: 'ArrowRight', span: 2}}
            ]
        },
        '/tutorial/pages': {
            columns: 6,
            blocks: [
                {id: 'g-pg-eb', type: 'eyebrow', props: {text: 'Guide · Pages & sections', icon: 'FileText', span: 6}},
                {id: 'g-pg-h1', type: 'heading', props: {text: 'Pages & sections', level: 1, span: 6}},
                {id: 'g-pg-intro', type: 'text', props: {text: 'Open the Pages panel (the list icon) to see every page. Navigation groups the pages in your menu; everything else is grouped by section — the part before the slash in an address like menu/pizza.', span: 6}},
                {id: 'g-pg-l', type: 'list', props: {span: 6, variant: 'plain', size: 'md', icon: 'Check', items: [
                    {text: 'Add a page with the page (+) icon', icon: 'FilePlus'},
                    {text: 'Add a section with the folder (+) icon', icon: 'FolderPlus'},
                    {text: 'Each section has its own + to file a page inside it', icon: 'FolderTree'},
                    {text: 'Move a page into a section anytime — its links follow', icon: 'FolderInput'},
                    {text: 'Use the Navigation panel to order the menu and remove links', icon: 'Map'},
                    {text: 'Layout templates save a page’s layout to reuse elsewhere', icon: 'LayoutTemplate'}
                ]}},
                {id: 'g-pg-tip-h', type: 'heading', props: {text: 'This guide is a section', level: 3, span: 6}},
                {id: 'g-pg-tip-b', type: 'text', props: {text: 'Every page you’re reading lives under the tutorial section. The topics list on the main guide page links straight to each one.', span: 6}},
                {id: 'g-pg-d', type: 'divider', props: {span: 6}},
                {id: 'g-pg-back', type: 'button', props: {label: 'All topics', to: '/tutorial', variant: 'link', icon: 'BookOpen', span: 2}},
                {id: 'g-pg-next', type: 'button', props: {label: 'Next: Publishing', to: '/tutorial/publishing', variant: 'primary', icon: 'ArrowRight', span: 2}}
            ]
        },
        '/tutorial/publishing': {
            columns: 6,
            blocks: [
                {id: 'g-pb-eb', type: 'eyebrow', props: {text: 'Guide · Publishing', icon: 'Send', span: 6}},
                {id: 'g-pb-h1', type: 'heading', props: {text: 'Publishing & drafts', level: 1, span: 6}},
                {id: 'g-pb-intro', type: 'text', props: {text: 'Saving keeps your work as a draft. A page only goes live to visitors once you publish it — so you can edit safely and choose exactly when changes appear.', span: 6}},
                {id: 'g-pb-l', type: 'list', props: {span: 6, variant: 'plain', size: 'md', icon: 'Check', items: [
                    {text: 'Publish — make the current page live', icon: 'Send'},
                    {text: 'Unpublish — take a page offline (visitors get a friendly notice)', icon: 'EyeOff'},
                    {text: 'A badge shows Published, Edited (live, with newer drafts), or Draft', icon: 'BadgeCheck'},
                    {text: 'The dashboard’s Publishing tab lists every page’s status', icon: 'LayoutDashboard'},
                    {text: 'Every publish and unpublish is logged with a timestamp', icon: 'History'}
                ]}},
                {id: 'g-pb-d', type: 'divider', props: {span: 6}},
                {id: 'g-pb-back', type: 'button', props: {label: 'All topics', to: '/tutorial', variant: 'link', icon: 'BookOpen', span: 2}},
                {id: 'g-pb-next', type: 'button', props: {label: 'Next: Design', to: '/tutorial/design', variant: 'primary', icon: 'ArrowRight', span: 2}}
            ]
        },
        '/tutorial/design': {
            columns: 6,
            blocks: [
                {id: 'g-de-eb', type: 'eyebrow', props: {text: 'Guide · Design & theme', icon: 'Palette', span: 6}},
                {id: 'g-de-h1', type: 'heading', props: {text: 'Design & theme', level: 1, span: 6}},
                {id: 'g-de-intro', type: 'text', props: {text: 'Open the Theme panel to change how the whole site looks — colors, fonts, and header style — and save your favorite combinations as presets.', span: 6}},
                {id: 'g-de-l', type: 'list', props: {span: 6, variant: 'plain', size: 'md', icon: 'Check', items: [
                    {text: 'Pick a font for the whole site', icon: 'Type'},
                    {text: 'Set the background and its four corner glows', icon: 'Sparkles'},
                    {text: 'Choose button, icon, and divider colors', icon: 'Palette'},
                    {text: 'Set every text color and the card hover border', icon: 'Brush'},
                    {text: 'Make the header translucent or a solid color', icon: 'PanelTop'},
                    {text: 'Save presets to reuse a look later', icon: 'Save'}
                ]}},
                {id: 'g-de-tip-h', type: 'heading', props: {text: 'Header & footer', level: 3, span: 6}},
                {id: 'g-de-tip-b', type: 'text', props: {text: 'Your brand name, icon, and menu links live in the header. The footer appears on every page and is edited just like any page.', span: 6}},
                {id: 'g-de-d', type: 'divider', props: {span: 6}},
                {id: 'g-de-back', type: 'button', props: {label: 'All topics', to: '/tutorial', variant: 'link', icon: 'BookOpen', span: 2}},
                {id: 'g-de-next', type: 'button', props: {label: 'Next: Images', to: '/tutorial/images', variant: 'primary', icon: 'ArrowRight', span: 2}}
            ]
        },
        '/tutorial/images': {
            columns: 6,
            blocks: [
                {id: 'g-im-eb', type: 'eyebrow', props: {text: 'Guide · Images & media', icon: 'Image', span: 6}},
                {id: 'g-im-h1', type: 'heading', props: {text: 'Images & media', level: 1, span: 6}},
                {id: 'g-im-intro', type: 'text', props: {text: 'Add an Image block (or a picture on an Item), upload a photo, then fine-tune exactly how it sits in its frame.', span: 6}},
                {id: 'g-im-l', type: 'list', props: {span: 6, variant: 'plain', size: 'md', icon: 'Check', items: [
                    {text: 'Upload photos — common formats and Apple HEIC are supported', icon: 'Upload'},
                    {text: 'Click “Adjust image” to reposition and zoom', icon: 'Crop'},
                    {text: 'Switch between Fill (crop to frame) and Fit (show all)', icon: 'Scaling'},
                    {text: 'Add a caption and link the image to a page', icon: 'Link2'},
                    {text: 'Videos work too, right inside a frame', icon: 'Video'}
                ]}},
                {id: 'g-im-ex', type: 'image', props: {url: '/build-your-site.webp', caption: 'Try clicking “Adjust image” on this one', span: 6}},
                {id: 'g-im-d', type: 'divider', props: {span: 6}},
                {id: 'g-im-back', type: 'button', props: {label: 'All topics', to: '/tutorial', variant: 'link', icon: 'BookOpen', span: 2}},
                {id: 'g-im-next', type: 'button', props: {label: 'Next: Backups', to: '/tutorial/backups', variant: 'primary', icon: 'ArrowRight', span: 2}}
            ]
        },
        '/tutorial/backups': {
            columns: 6,
            blocks: [
                {id: 'g-bk-eb', type: 'eyebrow', props: {text: 'Guide · Backups', icon: 'Archive', span: 6}},
                {id: 'g-bk-h1', type: 'heading', props: {text: 'Backups — important!', level: 1, span: 6}},
                {id: 'g-bk-intro', type: 'text', props: {text: 'In the dashboard’s Backup tab, download one .zip that contains your entire site — every page, template, theme, item, image, and admin login. Keep it somewhere safe, off the server.', span: 6}},
                {id: 'g-bk-l', type: 'list', props: {span: 6, variant: 'plain', size: 'md', icon: 'Check', items: [
                    {text: 'Download a backup regularly — it only takes a click', icon: 'Download'},
                    {text: 'Restore rebuilds the whole site from that one file', icon: 'Upload'},
                    {text: 'It even works onto brand-new, empty storage', icon: 'Server'},
                    {text: 'The dashboard also manages items and your password', icon: 'Settings'}
                ]}},
                {id: 'g-bk-done-h', type: 'heading', props: {text: 'You’re ready', level: 2, span: 6}},
                {id: 'g-bk-done-b', type: 'text', props: {text: 'That’s the whole guide. When you don’t need it anymore, unpublish or delete these pages from the Pages panel.', span: 6}},
                {id: 'g-bk-d', type: 'divider', props: {span: 6}},
                {id: 'g-bk-back', type: 'button', props: {label: 'Back to all topics', to: '/tutorial', variant: 'primary', icon: 'BookOpen', span: 2}}
            ]
        },
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
    theme: {
        font: 'Inter',
        headerSolid: false,
        colors: {
            background: '#08111f', gradient1: '#b51f2b', gradient2: '#2458a3',
            gradient3: '#08111f', gradient4: '#08111f', button: '#e33445', icon: '#d7a64f', hover: '#d7a64f',
            header: '#0b1626', divider: '#d7a64f'
        },
        text: {
            heading: '#fffaf0', paragraph: '#b8c2d6', nav: '#fffaf0', button: '#ffffff',
            eyebrow: '#d7a64f', list: '#f4ead8', featured: '#d7a64f'
        }
    },
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
        steps: [
            {title: 'Step one', body: 'Describe the first step of working with you.'},
            {title: 'Step two', body: 'Describe the second step of working with you.'},
            {title: 'Step three', body: 'Describe the third step of working with you.'}
        ]
    },
    contact: {
        eyebrow: 'Get in touch',
        title: 'Contact',
        body: 'We’d love to hear from you. Reach out and we’ll get back to you soon.'
    }
};

function deepMerge(base, update) {
    if (Array.isArray(update)) return update;
    if (!update || typeof update !== 'object') return update ?? base;
    const out = {...(base && typeof base === 'object' && !Array.isArray(base) ? base : {})};
    for (const [key, value] of Object.entries(update)) out[key] = deepMerge(out[key], value);
    return out;
}

function parseAdminUsers(raw = 'jeremy:change-me,uncle:change-me') {
    return raw.split(',').map(x => x.trim()).filter(Boolean).map(pair => {
        const i = pair.indexOf(':');
        return {username: pair.slice(0, i), password: pair.slice(i + 1)};
    }).filter(u => u.username && u.password);
}

async function passwordMatches(input, configured) {
    if (configured?.startsWith?.('$2a$') || configured?.startsWith?.('$2b$') || configured?.startsWith?.('$2y$')) return bcrypt.compare(input, configured);
    return input === configured;
}

function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

function buildDatabaseUrl(env = {}) {
    const {POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB} = env;
    if (!POSTGRES_USER || !POSTGRES_PASSWORD || !POSTGRES_DB) return '';
    const host = env.POSTGRES_HOST || 'postgres';
    const port = env.POSTGRES_PORT || '5432';
    const user = encodeURIComponent(POSTGRES_USER);
    const pass = encodeURIComponent(POSTGRES_PASSWORD);
    return `postgresql://${user}:${pass}@${host}:${port}/${POSTGRES_DB}`;
}

export function createApp(options = {}) {
    const app = express();
    const PORT = Number(options.port ?? process.env.PORT ?? 8080);
    const ADMIN_PATH = (options.adminPath ?? process.env.ADMIN_PATH ?? '/woodshop-admin').replace(/\/$/, '') || '/woodshop-admin';
    const DATA_DIR = options.dataDir ?? process.env.DATA_DIR ?? path.join(__dirname, '..', 'data');
    const MAX_FILE_MB = Number(options.maxFileMb ?? process.env.MAX_FILE_MB ?? 250);
    const SESSION_SECRET = options.sessionSecret ?? process.env.SESSION_SECRET ?? 'change-this-session-secret';
    const NODE_ENV = options.nodeEnv ?? process.env.NODE_ENV ?? 'development';

    const DATABASE_URL = options.databaseUrl ?? process.env.DATABASE_URL ?? buildDatabaseUrl(process.env);
    const S3_ENDPOINT = options.s3Endpoint ?? process.env.S3_ENDPOINT ?? '';
    const S3_REGION = options.s3Region ?? process.env.S3_REGION ?? 'us-east-1';
    const S3_BUCKET = options.s3Bucket ?? process.env.S3_BUCKET ?? 'joes-custom-flags-cms-media';
    const S3_ACCESS_KEY = options.s3AccessKey ?? process.env.S3_ACCESS_KEY ?? '';
    const S3_SECRET_KEY = options.s3SecretKey ?? process.env.S3_SECRET_KEY ?? '';
    const S3_FORCE_PATH_STYLE = String(options.s3ForcePathStyle ?? process.env.S3_FORCE_PATH_STYLE ?? 'true') !== 'false';

    const DB_FILE = path.join(DATA_DIR, 'items.json');
    const LEGACY_DB_FILE = path.join(DATA_DIR, 'works.json');
    const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
    const USERS_FILE = path.join(DATA_DIR, 'admin-users.json');
    const UPLOAD_DIR = options.uploadDir ?? process.env.UPLOAD_DIR ?? path.join(DATA_DIR, 'uploads');
    const SESSION_DIR = path.join(DATA_DIR, 'sessions');

    fs.mkdirSync(DATA_DIR, {recursive: true});
    fs.mkdirSync(UPLOAD_DIR, {recursive: true});
    fs.mkdirSync(SESSION_DIR, {recursive: true});
    // Migrate the old file-storage name (works.json → items.json) if present.
    if (!fs.existsSync(DB_FILE) && fs.existsSync(LEGACY_DB_FILE)) {
        try {
            fs.renameSync(LEGACY_DB_FILE, DB_FILE);
        } catch {
        }
    }

    const execFileAsync = promisify(execFile);
    const pool = DATABASE_URL ? new Pool({connectionString: DATABASE_URL}) : null;
    const hasS3 = Boolean(S3_ENDPOINT && S3_ACCESS_KEY && S3_SECRET_KEY && S3_BUCKET);
    const s3 = hasS3
        ? new S3Client({
            region: S3_REGION,
            endpoint: S3_ENDPOINT,
            forcePathStyle: S3_FORCE_PATH_STYLE,
            credentials: {accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY}
        })
        : null;

    async function initSql() {
        if (!pool) return;
        // Migrate the old table name (cms_works → cms_items) if it exists and the new
        // one doesn't, preserving existing data.
        await pool.query(`
            DO $$ BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cms_works')
                   AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cms_items') THEN
                    ALTER TABLE cms_works RENAME TO cms_items;
                END IF;
            END $$;
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cms_users (
                username   TEXT        PRIMARY KEY,
                password   TEXT        NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS cms_settings (
                id         INTEGER     PRIMARY KEY,
                payload    JSONB       NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS cms_items (
                id          UUID        PRIMARY KEY,
                title       TEXT        NOT NULL,
                price       TEXT        NOT NULL DEFAULT '',
                featured    BOOLEAN     NOT NULL DEFAULT FALSE,
                description TEXT        NOT NULL,
                media       JSONB       NOT NULL DEFAULT '[]'::jsonb,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        const uCount = Number((await pool.query('SELECT COUNT(*)::int AS c FROM cms_users')).rows[0].c || 0);
        if (!uCount) {
            const users = parseAdminUsers(options.adminUsers ?? process.env.ADMIN_USERS).map(u => ({
                username: u.username,
                password: u.password
            }));
            for (const u of users) await pool.query('INSERT INTO cms_users(username, password) VALUES($1, $2)', [u.username, u.password]);
        }

        const sCount = Number((await pool.query('SELECT COUNT(*)::int AS c FROM cms_settings')).rows[0].c || 0);
        if (!sCount) await pool.query('INSERT INTO cms_settings(id, payload) VALUES(1, $1::jsonb)', [JSON.stringify(defaultSettings)]);

        const wCount = Number((await pool.query('SELECT COUNT(*)::int AS c FROM cms_items')).rows[0].c || 0);
        if (!wCount) {
            for (const w of seedItems) {
                await pool.query('INSERT INTO cms_items(id,title,price,featured,description,media,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8)',
                    [w.id, w.title, w.price || '', Boolean(w.featured), w.description, JSON.stringify(w.media || []), w.createdAt, w.updatedAt]);
            }
        }
    }

    // Make sure the media bucket exists before we try to read/write objects, so a
    // brand-new MinIO/S3 (after a crash + fresh storage) works even without the
    // minio-init sidecar. Safe to call repeatedly.
    async function ensureBucket() {
        if (!s3) return;
        try {
            await s3.send(new HeadBucketCommand({Bucket: S3_BUCKET}));
        } catch {
            try {
                await s3.send(new CreateBucketCommand({Bucket: S3_BUCKET}));
                console.log(`Created S3 bucket "${S3_BUCKET}"`);
            } catch (e) {
                console.warn(`Could not ensure S3 bucket "${S3_BUCKET}":`, e?.message || e);
            }
        }
    }

    function readJson(file, fallback) {
        if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
        try {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch {
            return fallback;
        }
    }

    function writeJson(file, value) {
        fs.writeFileSync(file, JSON.stringify(value, null, 2));
    }

    async function readItems() {
        if (!pool) return readJson(DB_FILE, seedItems);
        const {rows} = await pool.query('SELECT id,title,price,featured,description,media,created_at,updated_at FROM cms_items ORDER BY created_at DESC');
        return rows.map(r => ({
            id: r.id,
            title: r.title,
            price: r.price,
            featured: r.featured,
            description: r.description,
            media: r.media || [],
            createdAt: new Date(r.created_at).toISOString(),
            updatedAt: new Date(r.updated_at).toISOString()
        }));
    }

    async function writeItems(items) {
        if (!pool) return writeJson(DB_FILE, items);
        await pool.query('BEGIN');
        try {
            await pool.query('DELETE FROM cms_items');
            for (const w of items) {
                await pool.query('INSERT INTO cms_items(id,title,price,featured,description,media,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8)',
                    [w.id, w.title, w.price || '', Boolean(w.featured), w.description, JSON.stringify(w.media || []), w.createdAt, w.updatedAt]);
            }
            await pool.query('COMMIT');
        } catch (e) {
            await pool.query('ROLLBACK');
            throw e;
        }
    }

    async function readSettings() {
        if (!pool) return deepMerge(defaultSettings, readJson(SETTINGS_FILE, defaultSettings));
        const {rows} = await pool.query('SELECT payload FROM cms_settings WHERE id=1');
        return deepMerge(defaultSettings, rows?.[0]?.payload || defaultSettings);
    }

    async function writeSettings(settings) {
        const next = deepMerge(defaultSettings, settings);
        if (!pool) return writeJson(SETTINGS_FILE, next);
        await pool.query('INSERT INTO cms_settings(id,payload,updated_at) VALUES(1,$1::jsonb,NOW()) ON CONFLICT (id) DO UPDATE SET payload=EXCLUDED.payload, updated_at=NOW()', [JSON.stringify(next)]);
    }

    async function readUsers() {
        if (!pool) {
            if (!fs.existsSync(USERS_FILE)) {
                const users = parseAdminUsers(options.adminUsers ?? process.env.ADMIN_USERS).map(u => ({
                    username: u.username,
                    password: u.password,
                    updatedAt: new Date().toISOString()
                }));
                writeJson(USERS_FILE, users);
            }
            return readJson(USERS_FILE, []);
        }
        const {rows} = await pool.query('SELECT username,password,updated_at FROM cms_users');
        return rows.map(r => ({
            username: r.username,
            password: r.password,
            updatedAt: new Date(r.updated_at).toISOString()
        }));
    }

    async function writeUsers(users) {
        if (!pool) return writeJson(USERS_FILE, users);
        await pool.query('BEGIN');
        try {
            await pool.query('DELETE FROM cms_users');
            for (const u of users) await pool.query('INSERT INTO cms_users(username,password,updated_at) VALUES($1,$2,$3)', [u.username, u.password, u.updatedAt || new Date().toISOString()]);
            await pool.query('COMMIT');
        } catch (e) {
            await pool.query('ROLLBACK');
            throw e;
        }
    }

    function safeJson(value, fallback = {}) {
        try {
            return JSON.parse(String(value || '{}'));
        } catch {
            return fallback;
        }
    }

    function clampNumber(value, min, max, fallback) {
        const n = Number(value);
        if (!Number.isFinite(n)) return fallback;
        return Math.min(max, Math.max(min, n));
    }

    // Placement is a focal-point + zoom model: {fit, x, y, scale}. `x`/`y` are
    // object-position percentages (50 = centre), `scale` zooms in, `fit` is
    // 'cover' (crop to fill) or 'contain' (letterbox). Old {x, y, width, height}
    // crop rectangles are converted to a focal centre + zoom for back-compat.
    function sanitizePlacement(input) {
        if (!input || typeof input !== 'object') return null;
        let c = input;
        if (typeof c.scale !== 'number' && typeof c.width === 'number' && c.width > 0) {
            c = {fit: 'cover', x: c.x + c.width / 2, y: c.y + (c.height || c.width) / 2, scale: 100 / c.width};
        }
        return {
            fit: c.fit === 'contain' ? 'contain' : 'cover',
            x: clampNumber(c.x, 0, 100, 50),
            y: clampNumber(c.y, 0, 100, 50),
            scale: clampNumber(c.scale, 1, 8, 1),
        };
    }

    function mediaWithPlacement(media, placement) {
        if (!media?.type?.startsWith('image/')) {
            const {placement: _ignored, ...withoutPlacement} = media || {};
            return withoutPlacement;
        }
        // Every image carries a placement; absent/invalid input falls back to centred cover.
        const sanitized = sanitizePlacement(placement ?? media.placement) ?? {fit: 'cover', x: 50, y: 50, scale: 1};
        return {...media, placement: sanitized};
    }

    function normalizeMedia(media = []) {
        return media.map(m => mediaWithPlacement(m));
    }

    function publicItem(item) {
        return {...item, media: normalizeMedia(item.media || [])};
    }

    function isHeicUpload(file) {
        const ext = path.extname(file.originalname || file.filename || '').toLowerCase();
        return file.mimetype === 'image/heic' || file.mimetype === 'image/heif' || ext === '.heic' || ext === '.heif';
    }

    async function convertImageBuffer(file) {
        const ext = path.extname(file.originalname || file.filename || '').toLowerCase();

        // Leave videos alone.
        if (file.mimetype?.startsWith('video/')) {
            return {
                buffer: file.buffer,
                ext: ext || '.bin',
                mimetype: file.mimetype
            };
        }

        // Only optimize image uploads.
        const isImage =
            file.mimetype?.startsWith('image/') ||
            ext === '.heic' ||
            ext === '.heif';

        if (!isImage) {
            return {
                buffer: file.buffer,
                ext: ext || '.bin',
                mimetype: file.mimetype || 'application/octet-stream'
            };
        }

        let inputBuffer = file.buffer;

        // HEIC/HEIF needs to be converted first before final WebP optimization.
        if (isHeicUpload(file)) {
            const tmpIn = path.join(os.tmpdir(), `${randomUUID()}.heic`);
            const tmpOut = path.join(os.tmpdir(), `${randomUUID()}.jpg`);

            fs.writeFileSync(tmpIn, file.buffer);

            try {
                await execFileAsync('heif-convert', ['-q', '90', tmpIn, tmpOut], {
                    timeout: 120000,
                    maxBuffer: 1024 * 1024 * 8
                });

                inputBuffer = fs.readFileSync(tmpOut);
            } catch {
                inputBuffer = await sharp(file.buffer)
                    .rotate()
                    .jpeg({quality: 90})
                    .toBuffer();
            } finally {
                try {
                    fs.unlinkSync(tmpIn);
                } catch {
                }

                try {
                    fs.unlinkSync(tmpOut);
                } catch {
                }
            }
        }

        // Final optimized image output. Keep uploads compact by default; the site
        // displays images in cards/blocks, so 1200px WebP is enough while saving a lot
        // of storage and bandwidth compared with large originals.
        const output = await sharp(inputBuffer)
            .rotate()
            .resize({
                width: 800,
                height: 800,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({
                quality: 70,
                effort: 6,
                smartSubsample: true
            })
            .toBuffer();

        return {
            buffer: output,
            ext: '.webp',
            mimetype: 'image/webp'
        };
    }

    async function saveMedia(file) {
        if (typeof options.convertImage === 'function') {
            const testFile = {...file, filename: file.filename || file.originalname || `${randomUUID()}.bin`};
            const convertedFile = await options.convertImage(testFile);
            return mediaWithPlacement({
                url: `/uploads/${convertedFile.filename}`,
                key: convertedFile.filename,
                type: convertedFile.mimetype,
                originalName: convertedFile.originalname || file.originalname,
                size: convertedFile.size || file.size || 0
            });
        }
        const converted = await convertImageBuffer(file);
        const key = `${Date.now()}-${randomUUID()}${converted.ext}`;
        if (s3) {
            await s3.send(new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: key,
                Body: converted.buffer,
                ContentType: converted.mimetype
            }));
        } else {
            fs.writeFileSync(path.join(UPLOAD_DIR, key), converted.buffer);
        }
        return {
            url: `/uploads/${key}`,
            key,
            type: converted.mimetype,
            originalName: file.originalname,
            size: converted.buffer.length
        };
    }

    async function deleteMediaByUrl(url) {
        if (!url?.startsWith('/uploads/')) return;
        const key = path.basename(url);
        if (s3) {
            await s3.send(new DeleteObjectCommand({Bucket: S3_BUCKET, Key: key}));
        } else {
            try {
                fs.unlinkSync(path.join(UPLOAD_DIR, key));
            } catch {
            }
        }
    }

    const MIME_BY_EXT = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
        '.gif': 'image/gif', '.avif': 'image/avif', '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.m4v': 'video/x-m4v'
    };

    function mimeFromKey(key) {
        return MIME_BY_EXT[path.extname(key).toLowerCase()] || 'application/octet-stream';
    }

    // List every stored media object key (whole S3 bucket, or the local upload dir).
    async function listMediaKeys() {
        if (s3) {
            const keys = [];
            let token;
            do {
                const out = await s3.send(new ListObjectsV2Command({Bucket: S3_BUCKET, ContinuationToken: token}));
                (out.Contents || []).forEach(o => o.Key && keys.push(o.Key));
                token = out.IsTruncated ? out.NextContinuationToken : undefined;
            } while (token);
            return keys;
        }
        try {
            return fs.readdirSync(UPLOAD_DIR).filter(f => fs.statSync(path.join(UPLOAD_DIR, f)).isFile());
        } catch {
            return [];
        }
    }

    // Fetch one stored object as {buffer, contentType} (for backup).
    async function getMedia(key) {
        if (s3) {
            const obj = await s3.send(new GetObjectCommand({Bucket: S3_BUCKET, Key: key}));
            return {buffer: await streamToBuffer(obj.Body), contentType: obj.ContentType || mimeFromKey(key)};
        }
        return {buffer: fs.readFileSync(path.join(UPLOAD_DIR, key)), contentType: mimeFromKey(key)};
    }

    // Store one object under an exact key (for restore).
    async function putMedia(key, buffer, contentType) {
        if (s3) {
            await s3.send(new PutObjectCommand({
                Bucket: S3_BUCKET, Key: key, Body: buffer, ContentType: contentType || mimeFromKey(key)
            }));
        } else {
            fs.writeFileSync(path.join(UPLOAD_DIR, key), buffer);
        }
    }

    async function uploadedFilesToMedia(files = [], placementMap = {}) {
        const stored = [];
        for (const f of files) {
            const saved = await saveMedia(f);
            stored.push(mediaWithPlacement({
                url: saved.url,
                key: saved.key,
                type: saved.type,
                originalName: saved.originalName,
                size: saved.size
            }, placementMap[f.originalname]));
        }
        return stored;
    }

    function validateItemInput(req, mediaCount) {
        if (!String(req.body.title || '').trim() || !String(req.body.description || '').trim()) return 'Title and description are required.';
        if (mediaCount < 1) return 'At least one image or video is required.';
        return null;
    }

    function isAdmin(req) {
        return Boolean(req.session?.adminUser);
    }

    function requireAdmin(req, res, next) {
        if (!isAdmin(req)) return res.status(401).json({error: 'Not authenticated'});
        next();
    }

    app.set('trust proxy', 1);
    app.use(express.json({limit: '2mb'}));
    // One-time: surface the built-in Tutorial page in the nav for sites created before
    // it existed. Guarded by a flag so it's added at most once — deleting it later sticks.
    async function migrateSettings() {
        let s = await readSettings();
        let changed = false;
        if (!s.tutorialMigrated) {
            const nav = Array.isArray(s.nav) ? [...s.nav] : [];
            if (!nav.some(n => n.path === '/tutorial')) {
                // Far left of the nav.
                nav.unshift({label: 'Tutorial', path: '/tutorial', icon: 'GraduationCap'});
            }
            s = {...s, nav, tutorialMigrated: true};
            changed = true;
        }
        if (!s.publishMigrated) {
            // Turn on the publish workflow without anything disappearing: publish every page
            // that already exists. New pages created after this start as drafts until published.
            const published = {};
            for (const [route, page] of Object.entries(s.layout || {})) published[route] = page;
            s = {...s, published, publishMigrated: true};
            changed = true;
        }
        if (!s.guideMigrated) {
            // The built-in guide grew into a hub + topic pages. Make sure they're present in
            // the nav (hidden) and published, even on sites that migrated before they existed.
            const nav = Array.isArray(s.nav) ? [...s.nav] : [];
            const published = {...(s.published || {})};
            const guidePages = ['/tutorial', '/tutorial/editing', '/tutorial/blocks', '/tutorial/columns',
                '/tutorial/pages', '/tutorial/publishing', '/tutorial/design', '/tutorial/images', '/tutorial/backups'];
            for (const route of guidePages) {
                if (!s.layout?.[route]) continue;
                if (route !== '/tutorial' && !nav.some(n => n.path === route)) {
                    nav.push({label: route.split('/').pop(), path: route, hidden: true});
                }
                if (!published[route]) published[route] = s.layout[route];
            }
            s = {...s, nav, published, guideMigrated: true};
            changed = true;
        }
        if (changed) await writeSettings(s);
    }

    app.locals.init = async () => {
        await initSql();
        await ensureBucket();
        await migrateSettings();
    };

    const FileStore = createFileStore(session);
    app.use(session({
        store: new FileStore({path: SESSION_DIR, retries: 0, ttl: 60 * 60 * 12}),
        name: 'joes_flags_sid',
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {httpOnly: true, sameSite: 'lax', secure: NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 12}
    }));

    const upload = multer({
        storage: multer.memoryStorage(),
        limits: {fileSize: MAX_FILE_MB * 1024 * 1024, files: 8},
        fileFilter: (_req, file, cb) => {
            const ext = path.extname(file.originalname || '').toLowerCase();
            if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || ext === '.heic' || ext === '.heif') cb(null, true);
            else cb(new Error('Only image and video uploads are allowed'));
        }
    });

    app.get('/api/health', (_req, res) => res.json({
        ok: true,
        adminPath: ADMIN_PATH,
        storage: {sql: Boolean(pool), s3: Boolean(s3)}
    }));
    app.get('/api/config', (req, res) => res.json({
        adminPath: ADMIN_PATH,
        isAdmin: isAdmin(req),
        adminUser: req.session?.adminUser || null
    }));
    app.get('/api/items', async (_req, res) => res.json((await readItems()).map(publicItem)));
    app.get('/api/settings', async (_req, res) => res.json(await readSettings()));

    app.get('/uploads/:key', async (req, res) => {
        const key = req.params.key;
        try {
            if (s3) {
                const obj = await s3.send(new GetObjectCommand({Bucket: S3_BUCKET, Key: key}));
                if (obj.ContentType) res.setHeader('Content-Type', obj.ContentType);
                obj.Body.pipe(res);
                return;
            }
            res.sendFile(path.join(UPLOAD_DIR, key));
        } catch {
            res.status(404).json({error: 'Media not found'});
        }
    });

    app.post('/api/admin/login', async (req, res) => {
        const {username, password} = req.body || {};
        const found = (await readUsers()).find(u => u.username === username);
        if (!found || !(await passwordMatches(String(password || ''), found.password))) return res.status(401).json({error: 'Invalid login'});
        req.session.adminUser = found.username;
        res.json({ok: true, user: found.username, adminPath: ADMIN_PATH});
    });
    app.post('/api/admin/logout', requireAdmin, (req, res) => req.session.destroy(() => res.json({ok: true})));
    app.get('/api/admin/me', (req, res) => res.json({
        isAdmin: isAdmin(req),
        user: req.session?.adminUser || null,
        adminPath: ADMIN_PATH
    }));

    app.post('/api/admin/change-password', requireAdmin, async (req, res) => {
        const {currentPassword, newPassword} = req.body || {};
        if (!newPassword || String(newPassword).length < 8) return res.status(400).json({error: 'New password must be at least 8 characters.'});
        const users = await readUsers();
        const idx = users.findIndex(u => u.username === req.session.adminUser);
        if (idx < 0) return res.status(404).json({error: 'Admin user not found.'});
        if (!(await passwordMatches(String(currentPassword || ''), users[idx].password))) return res.status(400).json({error: 'Current password is incorrect.'});
        users[idx] = {
            ...users[idx],
            password: await bcrypt.hash(String(newPassword), 12),
            updatedAt: new Date().toISOString()
        };
        await writeUsers(users);
        res.json({ok: true});
    });

    app.get('/api/admin/settings', requireAdmin, async (_req, res) => res.json(await readSettings()));
    // Sync self-contained "item" blocks in the page layout into the Items DB, so pieces
    // created on a page also appear in the dashboard. New blocks get an itemId written
    // back into the layout; existing ones are updated in place. The legacy block type
    // 'work' and the legacy prop 'workId' are still recognised for older pages.
    async function syncItemBlocks(settings) {
        if (!settings || !settings.layout) return;
        const items = await readItems();
        const byId = new Map(items.map(w => [w.id, w]));
        for (const route of Object.keys(settings.layout)) {
            const pg = settings.layout[route];
            for (const b of (pg?.blocks || [])) {
                if ((b.type !== 'item' && b.type !== 'work') || !b.props || !b.props.image) continue;
                const {title, description, price, image} = b.props;
                const itemId = b.props.itemId ?? b.props.workId;

                const media = [{
                    url: image,
                    type: image?.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
                    originalName: title || 'item'
                }];

                const now = new Date().toISOString();
                if (itemId && byId.has(itemId)) {
                    const w = byId.get(itemId);
                    Object.assign(w, {
                        title: title || '', description: description || '',
                        price: price || '', media, updatedAt: now
                    });
                } else {
                    const id = randomUUID();
                    const w = {
                        id, title: title || '', price: price || '', featured: false,
                        description: description || '', media, createdAt: now, updatedAt: now
                    };
                    items.unshift(w);
                    byId.set(id, w);
                    b.props.itemId = id;
                    delete b.props.workId;
                }
            }
        }
        await writeItems(items);
    }

    app.put('/api/admin/settings', requireAdmin, async (req, res) => {
        const body = req.body || {};
        const current = await readSettings();
        const next = deepMerge(current, body);
        // Preset collections must be replaceable (deepMerge can't delete keys), so a
        // removed theme/layout/published page actually persists.
        if (body.themes) next.themes = body.themes;
        if (body.layouts) next.layouts = body.layouts;
        if (body.published) next.published = body.published;
        if (Array.isArray(body.publishLog)) next.publishLog = body.publishLog;
        // Monotonic revision counter, bumped server-side on every save so the admin UI can
        // show an iterative version (v<major>.<rev>). Based on the stored value, not the
        // request body, so it never goes backwards even if a client posts a stale number.
        next.rev = (Number(current.rev) || 0) + 1;
        if (body.layout) await syncItemBlocks(next);
        await writeSettings(next);
        res.json(next);
    });

    app.post('/api/admin/preview-convert', requireAdmin, upload.single('file'), async (req, res) => {
        if (!req.file) return res.status(400).json({error: 'No file provided'});
        try {
            const converted = await convertImageBuffer(req.file);
            res.set('Content-Type', converted.mimetype);
            res.send(converted.buffer);
        } catch {
            res.status(500).json({error: 'Conversion failed'});
        }
    });

    // Store a standalone image (used by image blocks in the page builder).
    app.post('/api/admin/upload', requireAdmin, upload.single('file'), async (req, res) => {
        if (!req.file) return res.status(400).json({error: 'No file provided'});
        try {
            const saved = await saveMedia(req.file);
            res.json({url: saved.url, key: saved.key, type: saved.type});
        } catch {
            res.status(500).json({error: 'Upload failed'});
        }
    });

    app.post('/api/admin/items', requireAdmin, upload.array('media', 8), async (req, res) => {
        const items = await readItems();
        const now = new Date().toISOString();
        const newMediaPlacement = safeJson(req.body.newMediaPlacement);
        const files = await uploadedFilesToMedia(req.files || [], newMediaPlacement);
        const validationError = validateItemInput(req, files.length);
        if (validationError) return res.status(400).json({error: validationError});
        const item = {
            id: randomUUID(),
            title: String(req.body.title).trim(),
            price: req.body.price || '',
            description: String(req.body.description).trim(),
            media: files,
            createdAt: now,
            updatedAt: now
        };
        items.unshift(item);
        await writeItems(items);
        res.status(201).json(publicItem(item));
    });

    app.put('/api/admin/items/:id', requireAdmin, upload.array('media', 8), async (req, res) => {
        const items = await readItems();
        const idx = items.findIndex(w => w.id === req.params.id);
        if (idx < 0) return res.status(404).json({error: 'Not found'});
        const keep = new Set(String(req.body.keepMedia || '').split(',').filter(Boolean));
        const oldMedia = items[idx].media || [];
        const mediaPlacement = safeJson(req.body.mediaPlacement);
        const newMediaPlacement = safeJson(req.body.newMediaPlacement);
        const keptMedia = oldMedia.filter(m => keep.size === 0 ? true : keep.has(m.url)).map(m => mediaWithPlacement(m, mediaPlacement[m.url]));
        const newFiles = await uploadedFilesToMedia(req.files || [], newMediaPlacement);
        const validationError = validateItemInput(req, keptMedia.length + newFiles.length);
        if (validationError) return res.status(400).json({error: validationError});
        for (const m of oldMedia.filter(m => !keptMedia.some(k => k.url === m.url) && m.url?.startsWith('/uploads/'))) await deleteMediaByUrl(m.url);
        items[idx] = {
            ...items[idx],
            title: String(req.body.title).trim(),
            price: req.body.price || '',
            description: String(req.body.description).trim(),
            media: [...keptMedia, ...newFiles],
            updatedAt: new Date().toISOString()
        };
        await writeItems(items);
        res.json(publicItem(items[idx]));
    });

    app.delete('/api/admin/items/:id', requireAdmin, async (req, res) => {
        const items = await readItems();
        const item = items.find(w => w.id === req.params.id);
        if (!item) return res.status(404).json({error: 'Not found'});
        for (const m of (item.media || [])) if (m.url?.startsWith('/uploads/')) await deleteMediaByUrl(m.url);
        await writeItems(items.filter(w => w.id !== req.params.id));
        res.json({ok: true});
    });

    // ---- Full backup / restore (settings + works + every uploaded image) ----
    const BACKUP_VERSION = 1;
    // A separate multer that accepts any file (the backup zip), since the media
    // `upload` instance only allows image/video mime types.
    const uploadZip = multer({
        storage: multer.memoryStorage(),
        limits: {fileSize: 2 * 1024 * 1024 * 1024}
    });

    app.get('/api/admin/backup', requireAdmin, async (_req, res) => {
        try {
            const zip = new AdmZip();
            const settings = await readSettings();
            const items = await readItems();
            const users = await readUsers();
            zip.addFile('settings.json', Buffer.from(JSON.stringify(settings, null, 2)));
            zip.addFile('items.json', Buffer.from(JSON.stringify(items, null, 2)));
            // Admin logins (usernames + password hashes). Sensitive — the backup zip
            // must be stored securely.
            zip.addFile('users.json', Buffer.from(JSON.stringify(users, null, 2)));

            const keys = await listMediaKeys();
            const media = [];
            for (const key of keys) {
                try {
                    const {buffer, contentType} = await getMedia(key);
                    zip.addFile(`uploads/${key}`, buffer);
                    media.push({key, contentType, size: buffer.length});
                } catch {
                    // Skip objects that can't be read rather than failing the whole backup.
                }
            }

            zip.addFile('manifest.json', Buffer.from(JSON.stringify({
                version: BACKUP_VERSION,
                createdAt: new Date().toISOString(),
                counts: {items: items.length, media: media.length, users: users.length},
                storage: {sql: Boolean(pool), s3: Boolean(s3)},
                media
            }, null, 2)));

            const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="cms-backup-${stamp}.zip"`);
            res.send(zip.toBuffer());
        } catch {
            res.status(500).json({error: 'Backup failed'});
        }
    });

    app.post('/api/admin/restore', requireAdmin, uploadZip.single('file'), async (req, res) => {
        if (!req.file) return res.status(400).json({error: 'No backup file uploaded'});
        let zip;
        try {
            zip = new AdmZip(req.file.buffer);
        } catch {
            return res.status(400).json({error: 'That file is not a valid backup zip.'});
        }
        const readEntry = name => {
            const e = zip.getEntry(name);
            return e ? e.getData() : null;
        };
        try {
            const settingsRaw = readEntry('settings.json');
            // Accept items.json (current) or works.json (older backups).
            const itemsRaw = readEntry('items.json') || readEntry('works.json');
            if (!settingsRaw || !itemsRaw) {
                return res.status(400).json({error: 'Backup is missing settings.json or items.json.'});
            }
            const settings = JSON.parse(settingsRaw.toString('utf8'));
            const items = JSON.parse(itemsRaw.toString('utf8'));

            let manifest = {};
            const mRaw = readEntry('manifest.json');
            if (mRaw) try {
                manifest = JSON.parse(mRaw.toString('utf8'));
            } catch {
            }
            const ctByKey = Object.fromEntries((manifest.media || []).map(m => [m.key, m.contentType]));

            // Restore images first so links resolve as soon as settings/works land.
            await ensureBucket();
            let restoredMedia = 0;
            for (const entry of zip.getEntries()) {
                if (entry.isDirectory || !entry.entryName.startsWith('uploads/')) continue;
                const key = entry.entryName.slice('uploads/'.length);
                if (!key || key.includes('/') || key.includes('..')) continue; // flat keys only
                await putMedia(key, entry.getData(), ctByKey[key]);
                restoredMedia++;
            }

            await writeSettings(settings);
            await writeItems(items);

            // Restore admin logins last (and only if present + non-empty) so a failure
            // earlier in the restore can never wipe credentials and lock you out. Older
            // backups without users.json simply leave existing logins untouched.
            let restoredUsers = 0;
            const usersRaw = readEntry('users.json');
            if (usersRaw) {
                const users = JSON.parse(usersRaw.toString('utf8'));
                if (Array.isArray(users) && users.length && users.every(u => u.username && u.password)) {
                    await writeUsers(users);
                    restoredUsers = users.length;
                }
            }

            res.json({ok: true, restored: {items: items.length, media: restoredMedia, users: restoredUsers}});
        } catch (e) {
            res.status(500).json({error: 'Restore failed: ' + (e?.message || 'unknown error')});
        }
    });

    const dist = path.join(__dirname, '..', 'dist');
    app.use('/joe-business-card.jpg', express.static(path.join(dist, 'joe-business-card.jpg')));
    app.use(express.static(dist, {maxAge: '1h'}));
    app.use((req, res, next) => {
        if (req.method !== 'GET') return next();
        res.sendFile(path.join(dist, 'index.html'));
    });

    app.locals.cmsConfig = {PORT, ADMIN_PATH};
    return app;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
    const app = createApp();
    const {PORT, ADMIN_PATH} = app.locals.cmsConfig;
    await app.locals.init();
    app.listen(PORT, '0.0.0.0', () => console.log(`CMS listening on ${PORT}; admin path ${ADMIN_PATH}`));
}
