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
        {label: 'Tutorial', path: '/tutorial', icon: 'GraduationCap'},
        {label: 'Home', path: '/'},
        {label: 'Services', path: '/services'},
        {label: 'Gallery', path: '/gallery'},
        {label: 'About', path: '/about'},
        {label: 'Contact', path: '/contact', cta: true}
    ],
    layout: {
        '/': {
            columns: 2,
            blocks: [
                {id: 'home-eyebrow', type: 'eyebrow', props: {text: 'Welcome', icon: 'Sparkles', span: 2}},
                {id: 'home-heading', type: 'heading', props: {text: 'A beautiful website you can edit yourself.', level: 1, span: 2}},
                {id: 'home-body', type: 'text', props: {text: 'This is a starter template. Click anything to edit it, rearrange the blocks, choose your colors, and make it your own — no code required.', span: 2}},
                {id: 'home-cta1', type: 'button', props: {label: 'Get in touch', to: '/contact', variant: 'primary', icon: 'ArrowRight'}},
                {id: 'home-cta2', type: 'button', props: {label: 'See our work', to: '/gallery', variant: 'ghost'}},
                {id: 'home-proof', type: 'list', props: {items: [{text: 'Fully editable pages', icon: 'Pencil'}, {text: 'Your own colors & fonts', icon: 'Palette'}, {text: 'Looks great on phones & desktops', icon: 'Check'}], icon: 'BadgeCheck', span: 2}},
                {id: 'home-image', type: 'image', props: {url: '/build-your-site.webp', caption: 'Replace this with your own image', span: 2}},
                {id: 'home-divider', type: 'divider', props: {span: 2}},
                {id: 'home-h2', type: 'heading', props: {text: 'What we do', level: 2, span: 2}},
                {id: 'home-h2-body', type: 'text', props: {text: 'Briefly describe what your business offers and why people should choose you.', span: 2}},
                {id: 'home-learn', type: 'button', props: {label: 'Learn more about us', to: '/about', variant: 'link', icon: ''}}
            ]
        },
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
                {id: 'gal-1', type: 'item', props: {title: 'Project One', price: '', description: 'A short description of this project.', image: '/placeholder.webp'}},
                {id: 'gal-2', type: 'item', props: {title: 'Project Two', price: '', description: 'A short description of this project.', image: '/placeholder.webp'}},
                {id: 'gal-3', type: 'item', props: {title: 'Project Three', price: '', description: 'A short description of this project.', image: '/placeholder.webp'}}
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
        // Built-in admin tutorial (shown in nav on a fresh install).
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
                {id: 'tut-ex-item', type: 'item', props: {title: 'Example item', price: 'Custom quote', description: 'Items show here and in your dashboard’s Item tab. Add a picture, set a price (or whatever text you want), and link the whole card to a page.', image: '/placeholder.webp'}},

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
                {id: 'tut-dash-b', type: 'text', props: {text: 'Your private dashboard has three tabs: Item (add and manage items with photos or videos), Password (change your login), and Backup.'}},

                {id: 'tut-backup-h', type: 'heading', props: {text: '8 · Backups — important!', level: 2}},
                {id: 'tut-backup-b', type: 'text', props: {text: 'In the dashboard’s Backup tab, click “Download backup” to save one .zip containing every page, template, theme, item, image, and admin login. Keep it somewhere safe, off the server. If anything is ever lost, “Restore from backup” rebuilds the entire site from that file — even onto brand-new, empty storage. Download a fresh backup regularly.'}},

                {id: 'tut-end-h', type: 'heading', props: {text: 'You’re ready', level: 2}},
                {id: 'tut-end-b', type: 'text', props: {text: 'That’s everything. When you no longer need this guide, open Pages and uncheck “Nav” to hide it, or delete the page. Don’t forget to press Save.'}}
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
        const s = await readSettings();
        if (s.tutorialMigrated) return;
        const nav = Array.isArray(s.nav) ? [...s.nav] : [];
        if (!nav.some(n => n.path === '/tutorial')) {
            // Far left of the nav.
            nav.unshift({label: 'Tutorial', path: '/tutorial', icon: 'GraduationCap'});
        }
        await writeSettings({...s, nav, tutorialMigrated: true});
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
        const next = deepMerge(await readSettings(), body);
        // Preset collections must be replaceable (deepMerge can't delete keys), so a
        // removed theme/layout actually persists.
        if (body.themes) next.themes = body.themes;
        if (body.layouts) next.layouts = body.layouts;
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
