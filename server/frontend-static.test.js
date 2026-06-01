import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const source = readFileSync(path.join(projectRoot, 'src/main.jsx'), 'utf8');
const styles = readFileSync(path.join(projectRoot, 'src/styles.css'), 'utf8');

test('public work images expose admin placement styles for fit, crop, resize, and position', () => {
    assert.match(source, /function\s+placementStyle\s*\(/);
    assert.match(source, /objectFit\s*:/);
    assert.match(source, /objectPosition\s*:/);
    assert.match(source, /transform\s*:/);
    assert.match(styles, /\.media-placement-controls/);
    assert.match(styles, /\.placement-preview/);
});

test('clicking a public image opens a full-size image modal with accessible close controls', () => {
    assert.match(source, /function\s+ImageModal\s*\(/);
    assert.match(source, /role="dialog"/);
    assert.match(source, /aria-label="View full-size image"/);
    assert.match(source, /className="image-modal-backdrop"/);
    assert.match(source, /onClick=\{\(\)\s*=>\s*onImageOpen\?\.\(first\)\}/);
    assert.match(source, /<ImageModal image=\{modalImage\}/);
});

test('admin work form shows top success and validation error notifications', () => {
    assert.match(source, /className=\{`admin-notice admin-notice--\$\{notice\.type\}`\}/);
    assert.match(source, /setNotice\(\{type:'error', text:'Title and description are required\.'/);
    assert.match(source, /setNotice\(\{type:'success', text:`Work \$\{editing\?'updated':'added'\} successfully\.`\}/);
});

test('admin edit buttons scroll to the edit form', () => {
    assert.match(source, /formRef\.current\?\.scrollIntoView\(\{ behavior:'smooth', block:'start' \}\)/);
    assert.match(source, /startEdit=\{startEdit\}/);
});

test('admin work list is itemized with search and sort controls', () => {
    assert.match(source, /function\s+WorkList\s*\(\{works,setEditing,reload,startEdit\}\)/);
    assert.match(source, /placeholder="Search Items"/);
    assert.match(source, /Sort by/);
    assert.match(source, /sortMode/);
    assert.match(source, /className="work-carousel-shell"/);
    assert.match(source, /className="work-carousel-list"/);
    assert.match(styles, /\.admin-list-toolbar/);
    assert.match(styles, /\.work-list-row/);
});

test('admin work carousel has fixed width rows, max height, scroll snap, and fade edges', () => {
    assert.match(styles, /\.work-carousel-shell/);
    assert.match(styles, /max-height:\s*520px/);
    assert.match(styles, /overflow-y:\s*auto/);
    assert.match(styles, /mask-image:\s*linear-gradient/);
    assert.match(styles, /\.work-list-row\{[^}]*width:\s*100%/);
    assert.match(styles, /scroll-snap-align:\s*center/);
});

test('file input and preview explicitly support Apple HEIC images', () => {
    assert.match(source, /accept="image\/\*,\.heic,\.heif,video\/\*"/);
});
