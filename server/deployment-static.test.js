import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

test('runtime image installs libheif-tools for real Apple HEIC conversion fallback', () => {
    const dockerfile = readFileSync(path.join(root, 'Dockerfile'), 'utf8');
    assert.match(dockerfile, /apk add --no-cache[^\n]*libheif-tools/);
});

test('compose uses Jeremy private Docker registry image', () => {
    const compose = readFileSync(path.join(root, 'docker-compose.yml'), 'utf8');
    assert.match(compose, /image:\s*192\.168\.1\.123:5000\/joes-custom-flags-cms:latest/);
});
