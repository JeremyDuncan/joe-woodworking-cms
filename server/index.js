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
import {S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand} from '@aws-sdk/client-s3';

const {Pool} = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const seedWorks = [
    {
        id: randomUUID(),
        title: 'State Silhouette Flag',
        price: 'Custom quote',
        featured: true,
        description: 'A hand-crafted American flag shaped into a state silhouette with a custom lower detail area.',
        media: [{url: '/joe-business-card.jpg', type: 'image/jpeg', originalName: 'Joe business card example'}],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: randomUUID(),
        title: 'Military Tribute Flag',
        price: 'Custom quote',
        featured: false,
        description: 'Personalized for Army, Navy, Air Force, Marines, Coast Guard, Space Force, veterans, and memorial gifts.',
        media: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const defaultSettings = {
    brandName: "Joe’s Custom Flags",
    brandShort: "Joe’s Flags",
    brandIcon: 'Flag',
    email: 'Smokingjoe38@yahoo.com',
    phone: '706.299.8309',
    nav: [
        {label: 'Home', path: '/'},
        {label: 'Work', path: '/work'},
        {label: 'Options', path: '/options'},
        {label: 'Process', path: '/process'},
        {label: 'Contact', path: '/contact'}
    ],
    layout: {
        '/': {
            columns: 2,
            blocks: [
                {id: 'home-eyebrow', type: 'eyebrow', props: {text: 'Joe’s Custom Hand Crafted Flags', icon: 'Star', span: 2}},
                {id: 'home-heading', type: 'heading', props: {text: 'Hand-crafted American flags built to become family heirlooms.', level: 1, span: 2}},
                {id: 'home-body', type: 'text', props: {text: 'Custom solid-wood American flag decor by Joe — hand-built, hand-painted, and personalized with logos, service branches, teams, memorials, patriotic themes, or your own image.', span: 2}},
                {id: 'home-cta1', type: 'button', props: {label: 'Request a custom flag', to: '/contact', variant: 'primary', icon: 'ArrowRight'}},
                {id: 'home-cta2', type: 'button', props: {label: 'View recent work', to: '/work', variant: 'ghost'}},
                {id: 'home-proof', type: 'list', props: {items: ['48 inches tall', 'Solid 2x12 wood', 'Hand-painted finish', 'State-shaped flags available'], icon: 'BadgeCheck', span: 2}},
                {id: 'home-image', type: 'image', props: {source: 'featured', span: 2}}
            ]
        },
        '/work': {
            columns: 1,
            blocks: [
                {id: 'work-eyebrow', type: 'eyebrow', props: {text: 'Recent work gallery', icon: 'Star'}},
                {id: 'work-heading', type: 'heading', props: {text: 'Built for homes, shops, offices, veteran gifts, and patriotic celebrations.', level: 1}},
                {id: 'work-body', type: 'text', props: {text: 'Browse recent custom pieces and examples. Add a Work item block for each piece.'}}
            ]
        },
        '/options': {
            columns: 1,
            blocks: [
                {id: 'opt-eyebrow', type: 'eyebrow', props: {text: 'Your flag, your story', icon: 'Sparkles'}},
                {id: 'opt-heading', type: 'heading', props: {text: 'Choose from ready-made concepts or send your own idea.', level: 1}},
                {id: 'opt-body', type: 'text', props: {text: 'Every flag includes a lower custom design area for artwork that makes the piece personal.'}},
                {id: 'opt-list', type: 'list', props: {items: ['Business logos', 'College & professional teams', 'All military branches', '250 years of freedom themes', 'Memorial & service tributes', 'Your supplied custom artwork'], icon: 'Medal'}}
            ]
        },
        '/process': {
            columns: 1,
            blocks: [
                {id: 'proc-eyebrow', type: 'eyebrow', props: {text: 'Simple ordering process', icon: 'Star'}},
                {id: 'proc-heading', type: 'heading', props: {text: 'From message to finished piece.', level: 1}},
                {id: 'proc-s1h', type: 'heading', props: {text: '1 · Share your idea', level: 3}},
                {id: 'proc-s1b', type: 'text', props: {text: 'Send a theme, logo, team, branch, memorial concept, or reference image.'}},
                {id: 'proc-s2h', type: 'heading', props: {text: '2 · Approve the direction', level: 3}},
                {id: 'proc-s2b', type: 'text', props: {text: 'Pick from available design options or refine a custom layout for the lower panel.'}},
                {id: 'proc-s3h', type: 'heading', props: {text: '3 · Hand-built with pride', level: 3}},
                {id: 'proc-s3b', type: 'text', props: {text: 'Your solid wood flag is crafted, painted, finished, and prepared for pickup or delivery.'}}
            ]
        },
        '/contact': {
            columns: 1,
            blocks: [
                {id: 'con-eyebrow', type: 'eyebrow', props: {text: 'Ready to start?', icon: 'Star'}},
                {id: 'con-heading', type: 'heading', props: {text: 'Message with questions or to commission a custom American flag.', level: 1}},
                {id: 'con-body', type: 'text', props: {text: 'Tell us the design you have in mind, who the flag is for, and whether you have artwork or a logo to include.'}},
                {id: 'con-list', type: 'list', props: {items: ['Email: Smokingjoe38@yahoo.com', 'Phone / text: 706.299.8309'], icon: 'Mail'}}
            ]
        }
    },
    layouts: {},
    theme: {
        font: 'Inter',
        colors: {
            background: '#08111f', gradient1: '#b51f2b', gradient2: '#2458a3',
            gradient3: '#08111f', gradient4: '#08111f', button: '#e33445', icon: '#d7a64f'
        },
        text: {
            heading: '#fffaf0', paragraph: '#b8c2d6', nav: '#fffaf0', button: '#ffffff',
            eyebrow: '#d7a64f', list: '#f4ead8', featured: '#d7a64f'
        }
    },
    themes: {},
    home: {
        eyebrow: 'Joe’s Custom Hand Crafted Flags',
        title: 'Hand-crafted American flags built to become family heirlooms.',
        body: 'Custom solid-wood American flag decor by Joe — hand-built, hand-painted, and personalized with logos, service branches, teams, memorials, patriotic themes, or your own image.',
        primaryCta: 'Request a custom flag',
        secondaryCta: 'View recent work'
    },
    proof: ['48 inches tall', 'Solid 2x12 wood', 'Hand-painted finish', 'State-shaped flags available'],
    work: {
        eyebrow: 'Recent work gallery',
        title: 'Built for homes, shops, offices, veteran gifts, and patriotic celebrations.',
        body: 'Browse recent custom pieces and examples. Photos and videos are managed by the private CMS.'
    },
    options: {
        eyebrow: 'Your flag, your story',
        title: 'Choose from ready-made concepts or send your own idea.',
        body: 'Every flag includes a lower custom design area for artwork that makes the piece personal.',
        items: ['Business logos', 'College & professional teams', 'All military branches', '250 years of freedom themes', 'Memorial & service tributes', 'Your supplied custom artwork']
    },
    process: {
        eyebrow: 'Simple ordering process',
        title: 'From message to finished piece.',
        steps: [
            {title: 'Share your idea', body: 'Send a theme, logo, team, branch, memorial concept, or reference image.'},
            {
                title: 'Approve the direction',
                body: 'Pick from available design options or refine a custom layout for the lower panel.'
            },
            {
                title: 'Hand-built with pride',
                body: 'Your solid wood flag is crafted, painted, finished, and prepared for pickup or delivery details.'
            }
        ]
    },
    contact: {
        eyebrow: 'Ready to start?',
        title: 'Message with questions or to commission a custom American flag.',
        body: 'Tell us the design you have in mind, who the flag is for, and whether you have artwork or a logo to include.'
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

    const DB_FILE = path.join(DATA_DIR, 'works.json');
    const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
    const USERS_FILE = path.join(DATA_DIR, 'admin-users.json');
    const UPLOAD_DIR = options.uploadDir ?? process.env.UPLOAD_DIR ?? path.join(DATA_DIR, 'uploads');
    const SESSION_DIR = path.join(DATA_DIR, 'sessions');

    fs.mkdirSync(DATA_DIR, {recursive: true});
    fs.mkdirSync(UPLOAD_DIR, {recursive: true});
    fs.mkdirSync(SESSION_DIR, {recursive: true});

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
            CREATE TABLE IF NOT EXISTS cms_works (
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

        const wCount = Number((await pool.query('SELECT COUNT(*)::int AS c FROM cms_works')).rows[0].c || 0);
        if (!wCount) {
            for (const w of seedWorks) {
                await pool.query('INSERT INTO cms_works(id,title,price,featured,description,media,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8)',
                    [w.id, w.title, w.price || '', Boolean(w.featured), w.description, JSON.stringify(w.media || []), w.createdAt, w.updatedAt]);
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

    async function readWorks() {
        if (!pool) return readJson(DB_FILE, seedWorks);
        const {rows} = await pool.query('SELECT id,title,price,featured,description,media,created_at,updated_at FROM cms_works ORDER BY created_at DESC');
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

    async function writeWorks(works) {
        if (!pool) return writeJson(DB_FILE, works);
        await pool.query('BEGIN');
        try {
            await pool.query('DELETE FROM cms_works');
            for (const w of works) {
                await pool.query('INSERT INTO cms_works(id,title,price,featured,description,media,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8)',
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

    function sanitizePlacement(input) {
        if (!input || typeof input !== 'object' || typeof input.width !== 'number') return null;
        return {
            x: clampNumber(input.x, 0, 100, 0),
            y: clampNumber(input.y, 0, 100, 0),
            width: clampNumber(input.width, 0.1, 100, 100),
            height: clampNumber(input.height, 0.1, 100, 100),
        };
    }

    function mediaWithPlacement(media, placement) {
        if (!media?.type?.startsWith('image/')) {
            const {placement: _ignored, ...withoutPlacement} = media || {};
            return withoutPlacement;
        }
        const sanitized = sanitizePlacement(placement ?? media.placement);
        if (sanitized === null) {
            const {placement: _ignored, ...withoutPlacement} = {...(media || {})};
            return withoutPlacement;
        }
        return {...media, placement: sanitized};
    }

    function normalizeMedia(media = []) {
        return media.map(m => mediaWithPlacement(m));
    }

    function publicWork(work) {
        return {...work, media: normalizeMedia(work.media || [])};
    }

    function isHeicUpload(file) {
        const ext = path.extname(file.originalname || file.filename || '').toLowerCase();
        return file.mimetype === 'image/heic' || file.mimetype === 'image/heif' || ext === '.heic' || ext === '.heif';
    }

    async function convertImageBuffer(file) {
        if (!isHeicUpload(file)) return {
            buffer: file.buffer,
            ext: path.extname(file.originalname || '') || '.bin',
            mimetype: file.mimetype
        };
        const tmpIn = path.join(os.tmpdir(), `${randomUUID()}.heic`);
        const tmpOut = path.join(os.tmpdir(), `${randomUUID()}.jpg`);
        fs.writeFileSync(tmpIn, file.buffer);
        try {
            await execFileAsync('heif-convert', ['-q', '90', tmpIn, tmpOut], {
                timeout: 120000,
                maxBuffer: 1024 * 1024 * 8
            });
            const out = fs.readFileSync(tmpOut);
            return {buffer: out, ext: '.jpg', mimetype: 'image/jpeg'};
        } catch {
            const out = await sharp(file.buffer).rotate().jpeg({quality: 90}).toBuffer();
            return {buffer: out, ext: '.jpg', mimetype: 'image/jpeg'};
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

    function validateWorkInput(req, mediaCount) {
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
    app.locals.init = initSql;

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
    app.get('/api/works', async (_req, res) => res.json((await readWorks()).map(publicWork)));
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
    app.put('/api/admin/settings', requireAdmin, async (req, res) => {
        const next = deepMerge(await readSettings(), req.body || {});
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

    app.post('/api/admin/works', requireAdmin, upload.array('media', 8), async (req, res) => {
        const works = await readWorks();
        const now = new Date().toISOString();
        const newMediaPlacement = safeJson(req.body.newMediaPlacement);
        const files = await uploadedFilesToMedia(req.files || [], newMediaPlacement);
        const validationError = validateWorkInput(req, files.length);
        if (validationError) return res.status(400).json({error: validationError});
        const work = {
            id: randomUUID(),
            title: String(req.body.title).trim(),
            price: req.body.price || '',
            description: String(req.body.description).trim(),
            featured: req.body.featured === 'true' || req.body.featured === 'on',
            media: files,
            createdAt: now,
            updatedAt: now
        };
        works.unshift(work);
        await writeWorks(works);
        res.status(201).json(publicWork(work));
    });

    app.put('/api/admin/works/:id', requireAdmin, upload.array('media', 8), async (req, res) => {
        const works = await readWorks();
        const idx = works.findIndex(w => w.id === req.params.id);
        if (idx < 0) return res.status(404).json({error: 'Not found'});
        const keep = new Set(String(req.body.keepMedia || '').split(',').filter(Boolean));
        const oldMedia = works[idx].media || [];
        const mediaPlacement = safeJson(req.body.mediaPlacement);
        const newMediaPlacement = safeJson(req.body.newMediaPlacement);
        const keptMedia = oldMedia.filter(m => keep.size === 0 ? true : keep.has(m.url)).map(m => mediaWithPlacement(m, mediaPlacement[m.url]));
        const newFiles = await uploadedFilesToMedia(req.files || [], newMediaPlacement);
        const validationError = validateWorkInput(req, keptMedia.length + newFiles.length);
        if (validationError) return res.status(400).json({error: validationError});
        for (const m of oldMedia.filter(m => !keptMedia.some(k => k.url === m.url) && m.url?.startsWith('/uploads/'))) await deleteMediaByUrl(m.url);
        works[idx] = {
            ...works[idx],
            title: String(req.body.title).trim(),
            price: req.body.price || '',
            description: String(req.body.description).trim(),
            featured: req.body.featured === 'true' || req.body.featured === 'on',
            media: [...keptMedia, ...newFiles],
            updatedAt: new Date().toISOString()
        };
        await writeWorks(works);
        res.json(publicWork(works[idx]));
    });

    app.delete('/api/admin/works/:id', requireAdmin, async (req, res) => {
        const works = await readWorks();
        const work = works.find(w => w.id === req.params.id);
        if (!work) return res.status(404).json({error: 'Not found'});
        for (const m of (work.media || [])) if (m.url?.startsWith('/uploads/')) await deleteMediaByUrl(m.url);
        await writeWorks(works.filter(w => w.id !== req.params.id));
        res.json({ok: true});
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
    app.listen(PORT, '0.0.0.0', () => console.log(`Joe's Flags CMS listening on ${PORT}; admin path ${ADMIN_PATH}`));
}
