import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createApp} from './index.js';

async function startTestServer(overrides = {}) {
    const root = mkdtempSync(path.join(tmpdir(), 'joes-cms-'));
    const app = createApp({
        port: 0,
        adminPath: '/secret-admin',
        dataDir: path.join(root, 'data'),
        uploadDir: path.join(root, 'uploads'),
        adminUsers: 'jeremy:oldpass,uncle:unclepass',
        sessionSecret: 'test-secret',
        nodeEnv: 'test',
        ...overrides
    });
    const server = await new Promise(resolve => {
        const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    let cookie = '';

    async function request(url, options = {}) {
        const headers = {...(options.headers || {})};
        if (cookie) headers.cookie = cookie;
        const res = await fetch(base + url, {...options, headers});
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) cookie = setCookie.split(';')[0];
        return res;
    }

    async function login(username = 'jeremy', password = 'oldpass') {
        const res = await request('/api/admin/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        assert.equal(res.status, 200);
        return res.json();
    }

    return {
        root, server, request, login, cleanup: async () => {
            await new Promise(resolve => server.close(resolve));
            await new Promise(resolve => setTimeout(resolve, 100));
            rmSync(root, {recursive: true, force: true});
        }
    };
}

test('admin can change their own password and log in with the new password', async () => {
    const t = await startTestServer();
    try {
        await t.login('jeremy', 'oldpass');
        const change = await t.request('/api/admin/change-password', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({currentPassword: 'oldpass', newPassword: 'newpass123'})
        });
        assert.equal(change.status, 200);

        await t.request('/api/admin/logout', {method: 'POST'});
        const oldLogin = await t.request('/api/admin/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: 'jeremy', password: 'oldpass'})
        });
        assert.equal(oldLogin.status, 401);
        const newLogin = await t.request('/api/admin/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: 'jeremy', password: 'newpass123'})
        });
        assert.equal(newLogin.status, 200);
    } finally {
        await t.cleanup();
    }
});

test('admin can customize public section text and settings persist through public API', async () => {
    const t = await startTestServer();
    try {
        await t.login();
        const patch = await t.request('/api/admin/settings', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                brandName: 'Custom Shop',
                hero: {title: 'A custom hero title', body: 'New hero body text'},
                work: {eyebrow: 'Portfolio', title: 'A custom Item section'},
                nav: [
                    {label: 'Home', path: '/'},
                    {label: 'Gallery', path: '/work'},
                    {label: 'Contact', path: '/contact'}
                ]
            })
        });
        assert.equal(patch.status, 200);
        const publicSettings = await t.request('/api/settings');
        assert.equal(publicSettings.status, 200);
        const json = await publicSettings.json();
        assert.equal(json.brandName, 'Custom Shop');
        assert.equal(json.hero.title, 'A custom hero title');
        assert.equal(json.work.title, 'A custom Item section');
        assert.deepEqual(json.nav.map(n => n.path), ['/', '/work', '/contact']);
    } finally {
        await t.cleanup();
    }
});

test('uploaded media returns url, type, originalName, size, and default image placement for admin preview confirmation', async () => {
    const t = await startTestServer();
    try {
        await t.login();
        const data = new FormData();
        data.append('title', 'Preview Item');
        data.append('price', 'Custom quote');
        data.append('description', 'Preview description');
        data.append('media', new Blob(['fake image bytes'], {type: 'image/png'}), 'preview.png');
        const res = await t.request('/api/admin/items', {method: 'POST', body: data});
        assert.equal(res.status, 201);
        const item = await res.json();
        assert.equal(item.media.length, 1);
        assert.equal(item.media[0].type, 'image/png');
        assert.equal(item.media[0].originalName, 'preview.png');
        assert.ok(item.media[0].size > 0);
        assert.match(item.media[0].url, /^\/uploads\//);
        assert.deepEqual(item.media[0].placement, {fit: 'cover', x: 50, y: 50, scale: 1});
    } finally {
        await t.cleanup();
    }
});

test('admin converts Apple HEIC uploads to browser-friendly JPEG media', async () => {
    const t = await startTestServer({
        convertImage: async file => ({
            ...file,
            filename: file.filename.replace(/\.heic$/i, '.jpg'),
            mimetype: 'image/jpeg'
        })
    });
    try {
        await t.login();
        const data = new FormData();
        data.append('title', 'HEIC Item');
        data.append('description', 'HEIC description');
        data.append('media', new Blob(['fake heic bytes'], {type: 'image/heic'}), 'apple-photo.heic');
        const res = await t.request('/api/admin/items', {method: 'POST', body: data});
        assert.equal(res.status, 201);
        const item = await res.json();
        assert.equal(item.media[0].type, 'image/jpeg');
        assert.equal(item.media[0].originalName, 'apple-photo.heic');
        assert.match(item.media[0].url, /\.jpg$/);
        assert.deepEqual(item.media[0].placement, {fit: 'cover', x: 50, y: 50, scale: 1});
    } finally {
        await t.cleanup();
    }
});

test('admin item create and update reject missing required fields or missing media', async () => {
    const t = await startTestServer();
    try {
        await t.login();
        const missingTitle = new FormData();
        missingTitle.append('description', 'Description only');
        missingTitle.append('media', new Blob(['fake image bytes'], {type: 'image/png'}), 'preview.png');
        const createRes = await t.request('/api/admin/items', {method: 'POST', body: missingTitle});
        assert.equal(createRes.status, 400);
        assert.match((await createRes.json()).error, /Title and description are required/);

        const valid = new FormData();
        valid.append('title', 'Valid Item');
        valid.append('description', 'Valid description');
        valid.append('media', new Blob(['fake image bytes'], {type: 'image/png'}), 'preview.png');
        const created = await t.request('/api/admin/items', {method: 'POST', body: valid});
        assert.equal(created.status, 201);
        const item = await created.json();

        const update = new FormData();
        update.append('title', '');
        update.append('description', 'Still has description');
        update.append('keepMedia', item.media.map(m => m.url).join(','));
        const updateRes = await t.request(`/api/admin/items/${item.id}`, {method: 'PUT', body: update});
        assert.equal(updateRes.status, 400);
    } finally {
        await t.cleanup();
    }
});

test('admin can save crop, resize, and position settings for image media only', async () => {
    const t = await startTestServer();
    try {
        await t.login();
        const create = new FormData();
        create.append('title', 'Placement Item');
        create.append('description', 'Placement description');
        create.append('newMediaPlacement', JSON.stringify({
            'preview.png': {fit: 'contain', x: 25, y: 80, scale: 1.4},
            'clip.mp4': {fit: 'cover', x: 1, y: 2, scale: 3}
        }));
        create.append('media', new Blob(['fake image bytes'], {type: 'image/png'}), 'preview.png');
        create.append('media', new Blob(['fake video bytes'], {type: 'video/mp4'}), 'clip.mp4');
        const created = await t.request('/api/admin/items', {method: 'POST', body: create});
        assert.equal(created.status, 201);
        const item = await created.json();
        const image = item.media.find(m => m.type === 'image/png');
        const video = item.media.find(m => m.type === 'video/mp4');
        assert.deepEqual(image.placement, {fit: 'contain', x: 25, y: 80, scale: 1.4});
        assert.equal(video.placement, undefined);

        const update = new FormData();
        update.append('title', item.title);
        update.append('description', item.description);
        update.append('keepMedia', item.media.map(m => m.url).join(','));
        update.append('mediaPlacement', JSON.stringify({[image.url]: {fit: 'cover', x: 62, y: 91, scale: 2.25}}));
        const updated = await t.request(`/api/admin/items/${item.id}`, {method: 'PUT', body: update});
        assert.equal(updated.status, 200);
        const updatedItem = await updated.json();
        assert.deepEqual(updatedItem.media.find(m => m.url === image.url).placement, {
            fit: 'cover',
            x: 62,
            y: 91,
            scale: 2.25
        });
        assert.equal(updatedItem.media.find(m => m.url === video.url).placement, undefined);
    } finally {
        await t.cleanup();
    }
});
