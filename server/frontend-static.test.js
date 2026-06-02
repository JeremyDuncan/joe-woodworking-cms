import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = p => readFileSync(path.join(root, p), 'utf8');

const itemList = read('src/admin/ItemList.jsx');
const itemForm = read('src/admin/ItemForm.jsx');
const imageModal = read('src/components/ImageModal.jsx');
const publicSite = read('src/pages/PublicSite.jsx');
const admin = read('src/admin/Admin.jsx');
const styles = read('src/styles.css');

test('clicking a public image opens a full-size modal with accessible controls', () => {
    assert.match(imageModal, /function\s+ImageModal\s*\(/);
    assert.match(imageModal, /role="dialog"/);
    assert.match(imageModal, /aria-label="View full-size image"/);
    assert.match(imageModal, /className="image-modal-backdrop"/);
    assert.match(publicSite, /<ImageModal image=\{modalImage\}/);
});

test('admin Item form shows success/validation notifications and supports HEIC', () => {
    assert.match(admin, /admin-notice admin-notice--\$\{notice\.type\}/);
    assert.match(itemForm, /Title and description are required\./);
    assert.match(itemForm, /Item \$\{editing \? 'updated' : 'added'\} successfully\./);
    assert.match(itemForm, /accept="image\/\*,\.heic,\.heif,video\/\*"/);
});

test('admin Item list is itemized with search and sort controls', () => {
    assert.match(itemList, /export function\s+ItemList\s*\(\{items, reload, startEdit\}\)/);
    assert.match(itemList, /placeholder="Search Items"/);
    assert.match(itemList, /sortMode/);
    assert.match(itemList, /className="item-carousel-shell"/);
    assert.match(itemList, /className="item-carousel-list"/);
    assert.match(styles, /\.admin-list-toolbar/);
    assert.match(styles, /\.item-list-row/);
});

test('admin Item carousel has fixed-width rows, max height, scroll snap, and fade edges', () => {
    assert.match(styles, /\.item-carousel-shell/);
    assert.match(styles, /max-height:\s*520px/);
    assert.match(styles, /overflow-y:\s*auto/);
    assert.match(styles, /mask-image:\s*linear-gradient/);
    assert.match(styles, /\.item-list-row\s*\{[^}]*width:\s*100%/);
    assert.match(styles, /scroll-snap-align:\s*center/);
});
