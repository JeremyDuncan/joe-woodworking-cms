import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {readFileSync} from 'node:fs';

// Make package.json's version available to the client (used for the admin version badge).
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

export default defineConfig({
    plugins: [react()],
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version)
    },
    server: {
        proxy: {
            '/api': 'http://localhost:8080',
            '/uploads': 'http://localhost:8080'
        }
    }
});
