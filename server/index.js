import express from 'express';
import session from 'express-session';
import createFileStore from 'session-file-store';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import {execFile, spawn} from 'child_process';
import {promisify} from 'util';
import {randomUUID} from 'crypto';
import fs from 'fs';
import {pipeline} from 'stream/promises';
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
    // Scratch space for large video uploads/transcodes (streamed here, never held in RAM).
    const TMP_DIR = path.join(DATA_DIR, 'tmp');

    fs.mkdirSync(DATA_DIR, {recursive: true});
    fs.mkdirSync(UPLOAD_DIR, {recursive: true});
    fs.mkdirSync(SESSION_DIR, {recursive: true});
    fs.mkdirSync(TMP_DIR, {recursive: true});
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

    // ---- Video transcode settings (the video analogue of the image resize/quality knobs) ----
    // Tuned for small files since the encode runs in the background. Every value is
    // env-overridable (set them in .production-env / .development-env). The "↓ size" note on
    // each one tells you which direction makes the output file SMALLER.

    // Max width/height in pixels: the longest side is scaled down to fit this box (never up).
    // ↓ size: LOWER it. 1280 = 720p (default). Try 960 (~540p) or 854 (480p) for big savings;
    // resolution is the biggest lever after CRF. Raise to 1920 for 1080p (larger files).
    const VIDEO_MAX_DIM = Number(options.videoMaxDim ?? process.env.VIDEO_MAX_DIM ?? 1920);

    // Constant Rate Factor = quality target for H.264 (0 = lossless/huge, 51 = tiny/ugly).
    // ↓ size: RAISE it. Each +2 ≈ ~15% smaller. 30 = default (good web quality); 32–34 = much
    // smaller, a little softer; lower to 24–26 if you want higher quality (bigger files).
    const VIDEO_CRF = Number(options.videoCrf ?? process.env.VIDEO_CRF ?? 30);

    // x264 effort/speed preset. Slower presets compress better at the SAME quality (smaller
    // file), they just take longer to encode. ↓ size: go SLOWER. Order: ultrafast → veryfast →
    // fast → medium → slow → slower → veryslow. ultrafast = fastest encode (default here).
    const VIDEO_PRESET = options.videoPreset ?? process.env.VIDEO_PRESET ?? 'ultrafast';

    // Frame-rate cap. Source clips above this are reduced to it (e.g. 60 fps phone video → 30);
    // clips already at/below it are unchanged.
    // ↓ size: LOWER it. 30 = default; 24 looks cinematic and shaves more; the saving is biggest
    // on 60 fps footage (roughly halves the video data).
    const VIDEO_FPS = Number(options.videoFps ?? process.env.VIDEO_FPS ?? 30);

    // Audio bitrate in kbps (AAC). Small slice of total size, but still tunable.
    // ↓ size: LOWER it. 96 = default (good stereo); 64 is fine for speech/ambient; raise to 128
    // for music-quality audio.
    const VIDEO_AUDIO_KBPS = Number(options.videoAudioKbps ?? process.env.VIDEO_AUDIO_KBPS ?? 64);

    // Hard limit on how long a single encode may run before we give up and keep the original.
    // Does NOT affect file size — it just needs enough headroom for the slower preset on long
    // clips. Raise it if very long videos are timing out (it's background work, so a big value
    // is safe); 1800000 ms = 30 minutes.
    const VIDEO_TIMEOUT_MS = Number(options.videoTimeoutMs ?? process.env.VIDEO_TIMEOUT_MS ?? 2800000);

    // ---- Keep transcoding from starving the web server ----
    // Encoding is CPU-heavy; without limits ffmpeg grabs every core and the site goes
    // unresponsive while a video processes. We cap how many cores it uses and run it at a low
    // OS priority so the web server always gets CPU first (it just encodes a bit slower).
    // VIDEO_THREADS: max cores ffmpeg may use. Default = all but one, so the server keeps a
    // core. Set to 1 on a small box for maximum responsiveness (slowest encode).
    const VIDEO_THREADS = Number(options.videoThreads ?? process.env.VIDEO_THREADS
        ?? Math.max(1, (os.cpus()?.length || 2) - 1));
    // VIDEO_NICE: Unix "niceness" 0–19 (higher = lower priority / yields more to the website).
    // 19 = be maximally polite. Set 0 to disable de-prioritising.
    const VIDEO_NICE = Number(options.videoNice ?? process.env.VIDEO_NICE ?? 19);

    // Probe for ffmpeg once and cache the answer. If it's not installed we skip background
    // transcoding entirely and just keep the original upload.
    let _ffmpegProbe = null;

    function ffmpegAvailable() {
        if (!_ffmpegProbe) {
            _ffmpegProbe = execFileAsync('ffmpeg', ['-version'], {timeout: 5000})
                .then(() => true).catch(() => false);
        }
        return _ffmpegProbe;
    }

    // Total duration of a media file in seconds (via ffprobe, which ships with ffmpeg). Used to
    // turn ffmpeg's elapsed-time progress into a percentage. Returns 0 if it can't be read.
    function probeDuration(inputPath) {
        return execFileAsync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', inputPath], {timeout: 30000})
            .then(({stdout}) => parseFloat(String(stdout).trim()) || 0)
            .catch(() => 0);
    }

    // Run ffmpeg, streaming its `-progress` output so we can report a 0..1 fraction as it encodes
    // (spawn, not execFile, so we read progress live). Resolves on success; rejects with the tail
    // of stderr attached so failures stay diagnosable.
    function encodeVideo(args, {onProgress, durationSec, timeoutMs}) {
        return new Promise((resolve, reject) => {
            const proc = spawn('ffmpeg', args);
            // Drop ffmpeg to a low OS priority so the web server keeps the event loop responsive
            // even while the encode is CPU-bound (best effort; lowering priority needs no perms).
            if (VIDEO_NICE > 0 && proc.pid) {
                try {
                    os.setPriority(proc.pid, VIDEO_NICE);
                } catch {
                }
            }
            let stderr = '';
            let buf = '';
            const timer = setTimeout(() => {
                proc.kill('SIGKILL');
                reject(Object.assign(new Error('ffmpeg timed out'), {stderr}));
            }, timeoutMs);
            proc.on('error', err => {
                clearTimeout(timer);
                reject(err);
            });
            proc.stderr?.on('data', d => {
                stderr += d.toString();
                if (stderr.length > 200000) stderr = stderr.slice(-200000);
            });
            proc.stdout?.on('data', d => {
                buf += d.toString();
                let nl;
                while ((nl = buf.indexOf('\n')) >= 0) {
                    const line = buf.slice(0, nl);
                    buf = buf.slice(nl + 1);
                    // out_time_us / out_time_ms are both microseconds in ffmpeg's progress output.
                    const m = durationSec > 0 && /^out_time_(?:us|ms)=(\d+)/.exec(line);
                    if (m) onProgress?.(Math.max(0, Math.min(0.999, (Number(m[1]) / 1e6) / durationSec)));
                }
            });
            proc.on('close', code => {
                clearTimeout(timer);
                if (code === 0) resolve();
                else reject(Object.assign(new Error(`ffmpeg exited with code ${code}`), {stderr}));
            });
        });
    }

    // Transcode an uploaded video to a compact, stream-friendly MP4: H.264 + AAC, downscaled
    // to fit a VIDEO_MAX_DIM box (handles portrait and landscape), with the moov atom moved to
    // the front (`+faststart`) so the browser can start playing before the whole file loads.
    // This mirrors the sharp→WebP step for images. If ffmpeg is missing or anything fails we
    // keep the original upload, so a save never breaks because of transcoding.
    // `file` may be {buffer} (small/in-memory) or {path} (a temp file already on disk — used
    // for large videos so gigabytes never sit in RAM). Returns {buffer, transcoded:true} on a
    // successful encode, or {buffer:file.buffer, transcoded:false} (keep original) on any
    // failure / missing ffmpeg.
    async function convertVideoBuffer(file, ext, onProgress) {
        const original = {buffer: file.buffer, ext: ext || '.mp4', mimetype: file.mimetype || 'video/mp4', transcoded: false};
        // Use the caller's file directly when we have a path; otherwise spill the buffer to disk.
        const ownsInput = !file.path;
        const tmpIn = file.path || path.join(TMP_DIR, `${randomUUID()}${ext || '.src'}`);
        const tmpOut = path.join(TMP_DIR, `${randomUUID()}.mp4`);
        try {
            if (ownsInput) fs.writeFileSync(tmpIn, file.buffer);
            // Cap the frame rate (halves data on 60 fps phone clips), fit the longest side within
            // a box without upscaling, then force even dimensions. Commas inside min() are escaped
            // so ffmpeg doesn't read them as filter separators.
            const vf = `fps=${VIDEO_FPS},scale=min(${VIDEO_MAX_DIM}\\,iw):min(${VIDEO_MAX_DIM}\\,ih)`
                + `:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`;
            const durationSec = await probeDuration(tmpIn);
            // H.264 video + AAC audio in an MP4 with the moov atom up front (`+faststart`) so it
            // streams immediately. Universally playable and fast to encode.
            await encodeVideo([
                '-i', tmpIn,
                '-threads', String(VIDEO_THREADS), // cap CPU cores so the website stays responsive
                '-vf', vf,
                '-c:v', 'libx264',
                '-preset', VIDEO_PRESET,
                '-crf', String(VIDEO_CRF),
                '-pix_fmt', 'yuv420p',
                '-c:a', 'aac',
                '-b:a', `${VIDEO_AUDIO_KBPS}k`,
                '-ac', '2',
                '-movflags', '+faststart',
                '-map_metadata', '-1',
                '-nostats', '-progress', 'pipe:1',
                '-y', tmpOut
            ], {onProgress, durationSec, timeoutMs: VIDEO_TIMEOUT_MS});
            const out = fs.readFileSync(tmpOut);
            if (out.length) return {buffer: out, ext: '.mp4', mimetype: 'video/mp4', transcoded: true};
            return original;
        } catch (err) {
            // Surface WHY it fell back (ffmpeg missing, decode error, etc.) — the last lines of
            // ffmpeg's stderr are the most useful.
            const detail = err?.code === 'ENOENT'
                ? 'ffmpeg not installed'
                : (err?.stderr ? String(err.stderr).trim().split('\n').slice(-2).join(' | ') : (err?.message || err));
            console.warn(`[video] transcode failed — keeping original (${detail})`);
            return original;
        } finally {
            // Only delete the input if we created it; a caller-supplied path is theirs to clean.
            if (ownsInput) {
                try {
                    fs.unlinkSync(tmpIn);
                } catch {
                }
            }
            try {
                fs.unlinkSync(tmpOut);
            } catch {
            }
        }
    }

    async function convertImageBuffer(file) {
        const ext = path.extname(file.originalname || file.filename || '').toLowerCase();

        // Compress videos to a stream-friendly MP4 (the parallel of the image → WebP step).
        if (file.mimetype?.startsWith('video/')) {
            return await convertVideoBuffer(file, ext);
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

    // Persist a buffer under a fresh, unique key and return it (reuses putMedia for storage).
    async function storeBuffer(buffer, ext, mimetype) {
        const key = `${Date.now()}-${randomUUID()}${ext}`;
        await putMedia(key, buffer, mimetype);
        return key;
    }

    // Store a file from disk under a fresh key WITHOUT reading it into memory — locally by a
    // move (instant) and to S3 by a streamed single-part PUT. For multi-GB video originals.
    async function storeFile(srcPath, ext, mimetype) {
        const key = `${Date.now()}-${randomUUID()}${ext}`;
        if (s3) {
            await s3.send(new PutObjectCommand({
                Bucket: S3_BUCKET, Key: key, Body: fs.createReadStream(srcPath),
                ContentLength: fs.statSync(srcPath).size, ContentType: mimetype
            }));
        } else {
            const dest = path.join(UPLOAD_DIR, key);
            try {
                fs.renameSync(srcPath, dest); // same filesystem: instant, no copy
            } catch {
                await pipeline(fs.createReadStream(srcPath), fs.createWriteStream(dest));
            }
        }
        return key;
    }

    // Give the background transcoder the original as a local file path (without buffering it):
    // locally that's just the stored file; from S3 we stream it down to a temp file first.
    async function originalToTempPath(key) {
        if (!s3) return {path: path.join(UPLOAD_DIR, key), cleanup: () => {}};
        const tmp = path.join(TMP_DIR, `${randomUUID()}${path.extname(key) || '.mp4'}`);
        const obj = await s3.send(new GetObjectCommand({Bucket: S3_BUCKET, Key: key}));
        await pipeline(obj.Body, fs.createWriteStream(tmp));
        return {
            path: tmp, cleanup: () => {
                try {
                    fs.unlinkSync(tmp);
                } catch {
                }
            }
        };
    }

    async function saveMedia(file, {deferVideo = false} = {}) {
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
        // Long videos can take minutes to transcode, which would block the upload request.
        // When ffmpeg is available we store the original immediately under its final .mp4 URL,
        // then optimize it in the background and overwrite the same key in place — so the URL
        // we return stays valid forever (no record to patch, which matters for page blocks
        // whose video isn't saved server-side until the admin clicks Save). Without ffmpeg we
        // fall through to the synchronous path (which just keeps the original).
        if (deferVideo && file.mimetype?.startsWith('video/') && await ffmpegAvailable()) {
            // Stored under the final .mp4 URL; the background transcode overwrites it in place.
            const key = await storeBuffer(file.buffer, '.mp4', 'video/mp4');
            enqueueTranscode(key);
            return {
                url: `/uploads/${key}`, key,
                type: 'video/mp4',
                originalName: file.originalname,
                size: file.buffer.length
            };
        }
        const converted = await convertImageBuffer(file);
        const key = await storeBuffer(converted.buffer, converted.ext, converted.mimetype);
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
            const saved = await saveMedia(f, {deferVideo: true});
            const record = mediaWithPlacement({
                url: saved.url,
                key: saved.key,
                type: saved.type,
                originalName: saved.originalName,
                size: saved.size
            }, placementMap[f.originalname]);
            stored.push(record);
        }
        return stored;
    }

    // ---- Background video transcoding ----
    // Serialize item write sequences in the request handlers so concurrent saves don't clobber
    // each other.
    let itemsTail = Promise.resolve();

    function withItemsLock(task) {
        const run = itemsTail.then(task, task);
        itemsTail = run.then(() => {}, () => {});
        return run;
    }

    // ---- Cross-process transcode queue (so a separate worker container can do the encoding) ----
    // Coordination is via small files on the shared data volume: `<key>.job` = queued,
    // `<key>.work` = claimed (holds live progress). A key is "processing" while either exists.
    // Claiming is an atomic rename, so the web process and a worker container can both run the
    // loop and never process the same video twice. Media itself lives in S3/disk (shared too).
    const JOBS_DIR = path.join(DATA_DIR, 'jobs');
    try {
        fs.mkdirSync(JOBS_DIR, {recursive: true});
    } catch {
    }
    const jobFile = (key, ext) => path.join(JOBS_DIR, `${key}.${ext}`);

    function writeJsonAtomic(file, data) {
        const tmp = `${file}.${randomUUID()}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(data));
        fs.renameSync(tmp, file);
    }

    // Cross-process mutex via atomic mkdir (works across containers on the shared volume).
    // Holds are brief (a JSON read+write), with a stale-lock breaker in case a holder dies.
    async function withFileLock(name, fn) {
        const dir = path.join(DATA_DIR, `.${name}.lock`);
        for (let i = 0; i < 600; i++) {
            try {
                fs.mkdirSync(dir);
                try {
                    return await fn();
                } finally {
                    try {
                        fs.rmdirSync(dir);
                    } catch {
                    }
                }
            } catch (e) {
                if (e.code !== 'EEXIST') throw e;
                try {
                    if (Date.now() - fs.statSync(dir).mtimeMs > 30000) fs.rmdirSync(dir);
                } catch {
                }
                await new Promise(r => setTimeout(r, 50));
            }
        }
        return fn(); // gave up waiting — proceed best-effort
    }

    function enqueueTranscode(key) {
        try {
            writeJsonAtomic(jobFile(key, 'job'), {key, createdAt: Date.now()});
        } catch {
        }
    }

    const jobList = ext => {
        try {
            return fs.readdirSync(JOBS_DIR).filter(f => f.endsWith(`.${ext}`));
        } catch {
            return [];
        }
    };

    function jobKeys() {
        const keys = new Set();
        for (const f of jobList('job')) keys.add(f.slice(0, -4));
        for (const f of jobList('work')) keys.add(f.slice(0, -5));
        return [...keys];
    }

    const jobExists = key => fs.existsSync(jobFile(key, 'job')) || fs.existsSync(jobFile(key, 'work'));

    const readProgress = key => {
        try {
            return Number(readJson(jobFile(key, 'work'), {}).progress) || 0;
        } catch {
            return 0;
        }
    };

    const writeProgress = (key, frac) => {
        try {
            writeJsonAtomic(jobFile(key, 'work'), {key, progress: frac, at: Date.now()});
        } catch {
        }
    };

    // Remove a job once it's done / deleted (clears it from "processing").
    function finishJob(key) {
        for (const ext of ['work', 'job']) {
            try {
                fs.unlinkSync(jobFile(key, ext));
            } catch {
            }
        }
    }

    // ---- Video catalog: the "library" shown in the dashboard + the block picker ----
    // A small persisted list of videos uploaded via the Video block, each with an editable
    // name. Status/progress are derived live from the job files, so they're never stale.
    const VIDEOS_FILE = path.join(DATA_DIR, 'videos.json');

    function readVideoCatalog() {
        const list = readJson(VIDEOS_FILE, []);
        return Array.isArray(list) ? list : [];
    }

    // Catalog reads-modify-writes are serialized cross-process (web + worker) by the file lock.
    function withVideos(mutator) {
        return withFileLock('videos', async () => {
            const list = readVideoCatalog();
            const result = await mutator(list);
            try {
                writeJsonAtomic(VIDEOS_FILE, list);
            } catch {
            }
            return result;
        });
    }

    const videoStatus = key => (jobExists(key) ? 'processing' : 'ready');

    function publicVideo(v) {
        const status = videoStatus(v.key);
        return {...v, status, progress: status === 'ready' ? 1 : readProgress(v.key)};
    }

    const addVideoToCatalog = entry => withVideos(list => {
        list.unshift({createdAt: new Date().toISOString(), ...entry});
    });

    const setVideoSize = (key, size) => withVideos(list => {
        const v = list.find(x => x.key === key);
        if (v) v.size = size;
    });

    // Claim the oldest queued job for this process via an atomic rename (.job -> .work).
    function claimJob() {
        for (const f of jobList('job').sort()) {
            const key = f.slice(0, -4);
            try {
                fs.renameSync(jobFile(key, 'job'), jobFile(key, 'work'));
                writeProgress(key, 0);
                return key;
            } catch {
                // Someone else claimed it first — try the next.
            }
        }
        return null;
    }

    // Transcode the original stored at `key` (streamed via a temp file so multi-GB originals
    // never load into RAM), then overwrite the SAME key in place — the optimized result is
    // small, so buffering that is fine. The stable key means the URL never changes.
    async function transcodeOne(key) {
        let src = null;
        try {
            src = await originalToTempPath(key).catch(() => null);
            if (!src) return;
            const before = fs.statSync(src.path).size;
            const ext = path.extname(key).toLowerCase() || '.mp4';
            const converted = await convertVideoBuffer({path: src.path, mimetype: 'video/mp4'}, ext,
                frac => writeProgress(key, frac));
            if (converted.transcoded && converted.buffer?.length) {
                await putMedia(key, converted.buffer, 'video/mp4');
                await setVideoSize(key, converted.buffer.length); // no-op if not a catalog video
                const mb = n => (n / 1048576).toFixed(1);
                console.log(`[video] optimized ${key}: ${mb(before)}MB -> ${mb(converted.buffer.length)}MB`);
            } else {
                console.warn(`[video] ${key} left unoptimized (transcode unavailable/failed)`);
            }
        } finally {
            src?.cleanup?.();
        }
    }

    // The transcode loop — run in-process by the web (unless handed off) AND/OR by a worker
    // container. Safe to run in multiple processes at once thanks to atomic claim-by-rename.
    let loopRunning = false;

    async function runTranscodeLoop() {
        if (loopRunning) return;
        loopRunning = true;
        // Requeue jobs a crash left mid-flight (a live job is heart-beated below, so only ones
        // untouched for >2 min are considered abandoned — never steals a peer's active job).
        for (const f of jobList('work')) {
            const key = f.slice(0, -5);
            try {
                if (Date.now() - fs.statSync(jobFile(key, 'work')).mtimeMs > 120000) {
                    fs.renameSync(jobFile(key, 'work'), jobFile(key, 'job'));
                }
            } catch {
            }
        }
        for (; ;) {
            const key = claimJob();
            if (!key) {
                await new Promise(r => setTimeout(r, 1500));
                continue;
            }
            // Keep the claim "fresh" during long encodes so peers don't reclaim it.
            const hb = setInterval(() => {
                try {
                    fs.utimesSync(jobFile(key, 'work'), new Date(), new Date());
                } catch {
                }
            }, 20000);
            try {
                await transcodeOne(key);
            } catch (e) {
                console.warn('[video] job failed', key, e?.message || e);
            } finally {
                clearInterval(hb);
                finishJob(key);
            }
        }
    }

    function validateItemInput(req, mediaCount) {
        if (!String(req.body.title || '').trim() || !String(req.body.description || '').trim()) return 'Title and description are required.';
        if (mediaCount < 1) return 'At least one image is required.';
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
        // Only the web process owns DB schema creation + one-time settings migrations. The worker
        // only encodes videos (it never writes to the DB), so it skips both — otherwise the two
        // containers race each other on CREATE TABLE, which Postgres can't do concurrently.
        const isWorker = (process.env.ROLE || 'web') === 'worker';
        if (!isWorker) await initSql();
        await ensureBucket();
        if (!isWorker) await migrateSettings();
        // Report whether video transcoding is actually available, so a missing ffmpeg is
        // obvious in the logs instead of silently shipping un-optimized uploads.
        ffmpegAvailable().then(ok => console.log(ok
            ? '[video] ffmpeg found — uploaded videos will be compressed to streaming MP4'
            : '[video] ffmpeg NOT found — videos will be stored as-is (install ffmpeg to enable compression)'));
    };
    // Exposed so the entry point can run it in-process (web) or as a dedicated worker container.
    app.locals.runTranscodeLoop = runTranscodeLoop;

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

    // Large videos stream straight to a temp file on disk (never buffered in RAM like the
    // memory-storage uploads above), so multi-gigabyte uploads don't blow up memory. Its own,
    // much higher size cap (default 4 GB) — overridable via VIDEO_MAX_MB.
    const VIDEO_MAX_MB = Number(options.videoMaxMb ?? process.env.VIDEO_MAX_MB ?? 4096);
    const uploadVideo = multer({
        storage: multer.diskStorage({
            destination: (_req, _file, cb) => cb(null, TMP_DIR),
            filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname || '') || '.src'}`)
        }),
        limits: {fileSize: VIDEO_MAX_MB * 1024 * 1024, files: 1},
        fileFilter: (_req, file, cb) => cb(null,
            file.mimetype.startsWith('video/') || /\.(mp4|mov|m4v|webm|avi|mkv|mpg|mpeg|3gp)$/i.test(file.originalname || ''))
    });

    app.get('/api/health', async (_req, res) => res.json({
        ok: true,
        adminPath: ADMIN_PATH,
        storage: {sql: Boolean(pool), s3: Boolean(s3)},
        videoTranscoding: await ffmpegAvailable() // false ⇒ ffmpeg missing, videos kept as-is
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
                // Forward the browser's Range header to S3 so video can seek/stream instead of
                // downloading whole. S3 answers a ranged GET with Content-Range + the partial
                // length; we relay those and a 206 so the <video> element streams properly.
                const range = req.headers.range;
                const obj = await s3.send(new GetObjectCommand({
                    Bucket: S3_BUCKET, Key: key, Range: range || undefined
                }));
                if (obj.ContentType) res.setHeader('Content-Type', obj.ContentType);
                res.setHeader('Accept-Ranges', 'bytes');
                if (obj.ETag) res.setHeader('ETag', obj.ETag);
                if (obj.LastModified) res.setHeader('Last-Modified', obj.LastModified.toUTCString());
                if (obj.CacheControl) res.setHeader('Cache-Control', obj.CacheControl);
                if (obj.ContentLength != null) res.setHeader('Content-Length', String(obj.ContentLength));
                if (obj.ContentRange) {
                    res.setHeader('Content-Range', obj.ContentRange);
                    res.status(206);
                }
                obj.Body.on('error', () => res.destroy());
                obj.Body.pipe(res);
                return;
            }
            res.sendFile(path.join(UPLOAD_DIR, key));
        } catch (err) {
            // An unsatisfiable Range → 416 so the player can recover; anything else → 404.
            if (err?.name === 'InvalidRange' || err?.Code === 'InvalidRange') {
                return res.status(416).set('Content-Range', 'bytes */*').end();
            }
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

    // Persist one block's video URL straight into the SAVED layout, so the result of an
    // asynchronous upload survives a page reload even before the admin re-saves the whole page.
    // 404 if the block hasn't been saved server-side yet (then it just lives in the draft until
    // the page is saved). Only patches that one block's url — other edits aren't committed.
    app.post('/api/admin/block-media', requireAdmin, async (req, res) => {
        const {route, blockId, url} = req.body || {};
        if (!route || !blockId || typeof url !== 'string' || !url) {
            return res.status(400).json({error: 'route, blockId and url are required'});
        }
        const settings = await readSettings();
        const block = settings.layout?.[route]?.blocks?.find(b => b.id === blockId);
        if (!block) {
            console.warn(`[video] block-media: block ${blockId} not in saved layout ${route} yet — save the page once so it can be linked`);
            return res.status(404).json({error: 'Block not found in the saved layout'});
        }
        block.props = {...(block.props || {}), url};
        await writeSettings(settings);
        console.log(`[video] linked block ${blockId} on ${route} -> ${url}`);
        res.json({ok: true});
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
            // Videos are deferred (stored now, optimized in the background) so a long upload
            // returns instantly; the stable URL lets a page block reference it right away.
            const saved = await saveMedia(req.file, {deferVideo: true});
            res.json({url: saved.url, key: saved.key, type: saved.type, processing: jobExists(saved.key)});
        } catch {
            res.status(500).json({error: 'Upload failed'});
        }
    });

    // Large-video upload for the Video block: streamed to disk (so gigabyte files don't sit in
    // RAM), stored immediately under its final URL, then optimized in the background.
    app.post('/api/admin/upload-video', requireAdmin, uploadVideo.single('file'), async (req, res) => {
        if (!req.file) return res.status(400).json({error: 'No video provided'});
        try {
            const key = await storeFile(req.file.path, '.mp4', 'video/mp4');
            // Catalog BEFORE queueing so the dashboard never sees a job without its library row.
            // Record it in the library with a friendly default name (the filename, sans ext).
            const name = String(req.file.originalname || 'Video').replace(/\.[^.]+$/, '').trim() || 'Video';
            await addVideoToCatalog({
                key, url: `/uploads/${key}`, name,
                originalName: req.file.originalname || '', size: req.file.size || 0
            });
            enqueueTranscode(key); // a worker (or the web's own loop) will pick this up
            res.json({url: `/uploads/${key}`, key, type: 'video/mp4', processing: true, name});
        } catch (err) {
            console.warn('[video] upload failed:', err?.message || err);
            res.status(500).json({error: 'Upload failed'});
        } finally {
            // storeFile moves the temp file on local storage; on S3 (or a copy fallback) it
            // remains, so always try to clean it up.
            try {
                fs.unlinkSync(req.file.path);
            } catch {
            }
        }
    });

    // Which uploaded videos are still being transcoded, plus each one's 0..1 encode progress
    // (the client polls this to show a percentage, clear the badge, and refresh when ready).
    app.get('/api/admin/transcode-status', requireAdmin, (_req, res) => res.json({
        keys: jobKeys(),
        progress: Object.fromEntries(jobKeys().map(k => [k, readProgress(k)]))
    }));

    // ---- Video library (dashboard "Video" tab + the Video block's picker) ----
    app.get('/api/admin/videos', requireAdmin, (_req, res) =>
        res.set('Cache-Control', 'no-store').json(readVideoCatalog().map(publicVideo)));

    // Rename a video (organisation only — the URL/key never changes).
    app.patch('/api/admin/videos/:key', requireAdmin, async (req, res) => {
        const name = String(req.body?.name || '').trim();
        if (!name) return res.status(400).json({error: 'A name is required.'});
        const found = await withVideos(list => {
            const v = list.find(x => x.key === req.params.key);
            if (v) v.name = name;
            return !!v;
        });
        if (!found) return res.status(404).json({error: 'Video not found.'});
        res.json({ok: true, name});
    });

    // Remove every page block that points at a media URL (from the draft layout AND the
    // published/live snapshot), so deleting a video also pulls the Video blocks that used it.
    async function removeBlocksWithUrl(url) {
        const settings = await readSettings();
        let changed = false;
        for (const layoutObj of [settings.layout, settings.published]) {
            for (const route of Object.keys(layoutObj || {})) {
                const pg = layoutObj[route];
                if (!Array.isArray(pg?.blocks)) continue;
                const next = pg.blocks.filter(b => b?.props?.url !== url);
                if (next.length !== pg.blocks.length) {
                    pg.blocks = next;
                    changed = true;
                }
            }
        }
        if (changed) await writeSettings(settings);
    }

    // Delete a video from the library, storage, and any pages that used it.
    app.delete('/api/admin/videos/:key', requireAdmin, async (req, res) => {
        const key = req.params.key;
        const found = await withVideos(list => {
            const i = list.findIndex(x => x.key === key);
            if (i >= 0) list.splice(i, 1);
            return i >= 0;
        });
        if (!found) return res.status(404).json({error: 'Video not found.'});
        finishJob(key); // drop any queued/active transcode job for it
        // It's already out of the catalog (the part the UI cares about) — respond now, then clean
        // up the media file and any Video blocks that referenced it in the background so a slow
        // storage/settings write can't hold up the UI.
        res.json({ok: true});
        const url = `/uploads/${key}`;
        deleteMediaByUrl(url).catch(() => {});
        removeBlocksWithUrl(url).catch(() => {});
    });

    app.post('/api/admin/items', requireAdmin, upload.array('media', 8), async (req, res) => {
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
        await withItemsLock(async () => {
            const items = await readItems();
            items.unshift(item);
            await writeItems(items);
        });
        res.status(201).json(publicItem(item));
    });

    app.put('/api/admin/items/:id', requireAdmin, upload.array('media', 8), async (req, res) => {
        // Cheap existence pre-check so we don't store uploads for a missing item (the common
        // 404). The authoritative re-check happens under the lock below.
        if (!(await readItems()).some(w => w.id === req.params.id)) return res.status(404).json({error: 'Not found'});
        const keep = new Set(String(req.body.keepMedia || '').split(',').filter(Boolean));
        const mediaPlacement = safeJson(req.body.mediaPlacement);
        const newMediaPlacement = safeJson(req.body.newMediaPlacement);
        const newFiles = await uploadedFilesToMedia(req.files || [], newMediaPlacement);
        let outcome = {status: 500, body: {error: 'Server error'}};
        await withItemsLock(async () => {
            const items = await readItems();
            const idx = items.findIndex(w => w.id === req.params.id);
            if (idx < 0) {
                outcome = {status: 404, body: {error: 'Not found'}};
                return;
            }
            const oldMedia = items[idx].media || [];
            const keptMedia = oldMedia.filter(m => keep.size === 0 ? true : keep.has(m.url)).map(m => mediaWithPlacement(m, mediaPlacement[m.url]));
            const validationError = validateItemInput(req, keptMedia.length + newFiles.length);
            if (validationError) {
                outcome = {status: 400, body: {error: validationError}};
                return;
            }
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
            outcome = {status: 200, body: publicItem(items[idx])};
        });
        res.status(outcome.status).json(outcome.body);
    });

    app.delete('/api/admin/items/:id', requireAdmin, async (req, res) => {
        let found = false;
        await withItemsLock(async () => {
            const items = await readItems();
            const item = items.find(w => w.id === req.params.id);
            if (!item) return;
            found = true;
            for (const m of (item.media || [])) if (m.url?.startsWith('/uploads/')) await deleteMediaByUrl(m.url);
            await writeItems(items.filter(w => w.id !== req.params.id));
        });
        if (!found) return res.status(404).json({error: 'Not found'});
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

    // Central error handler — most importantly so an upload the browser cancels (navigating away
    // mid-upload) doesn't spew an unhandled "Request aborted" and doesn't leave a temp file.
    app.use((err, req, res, _next) => {
        const cleanup = f => {
            if (f?.path) try {
                fs.unlinkSync(f.path);
            } catch {
            }
        };
        cleanup(req.file);
        (req.files || []).forEach(cleanup);
        const aborted = err?.message === 'Request aborted' || err?.code === 'ECONNABORTED'
            || err?.code === 'ECONNRESET' || req.aborted;
        if (aborted) return; // client went away; nothing to send
        if (res.headersSent) return;
        if (err instanceof multer.MulterError) {
            const msg = err.code === 'LIMIT_FILE_SIZE' ? 'That file is larger than the upload limit.' : err.message;
            return res.status(413).json({error: msg});
        }
        console.error('[server] unhandled error:', err?.message || err);
        res.status(500).json({error: 'Server error'});
    });

    // Periodically sweep abandoned upload temp files (e.g. from cancelled uploads) older than 6h.
    setInterval(() => {
        const cutoff = Date.now() - 6 * 3600 * 1000;
        try {
            for (const f of fs.readdirSync(TMP_DIR)) {
                const p = path.join(TMP_DIR, f);
                try {
                    if (fs.statSync(p).mtimeMs < cutoff) fs.unlinkSync(p);
                } catch {
                }
            }
        } catch {
        }
    }, 3600 * 1000).unref();

    app.locals.cmsConfig = {PORT, ADMIN_PATH};
    return app;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
    const app = createApp();
    const {PORT, ADMIN_PATH} = app.locals.cmsConfig;
    await app.locals.init();
    const role = process.env.ROLE || 'web';
    const handoff = /^(1|true|yes)$/i.test(process.env.TRANSCODE_HANDOFF || '');
    if (role === 'worker') {
        // Dedicated transcoding container: no HTTP server, just process the shared job queue.
        console.log('[worker] transcode worker started — watching the job queue');
        app.locals.runTranscodeLoop();
    } else {
        // Web: serve HTTP, and also run the transcode loop in-process unless it's been handed
        // off to a worker container (TRANSCODE_HANDOFF=1).
        if (!handoff) app.locals.runTranscodeLoop();
        app.listen(PORT, '0.0.0.0', () => console.log(
            `CMS listening on ${PORT}; admin path ${ADMIN_PATH}${handoff ? '; transcoding handed off to worker' : ''}`));
    }
}
