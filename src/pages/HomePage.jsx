import React from 'react';
import {PageBuilder} from '../blocks/PageBuilder.jsx';
import {blockRegistry} from '../blocks/registry.jsx';
import {defaultHomeLayout} from '../data/defaults.js';

export function HomePage({settings, featured, works, onImageOpen}) {
    const raw = settings.layout?.['/'];
    const layout = raw && !Array.isArray(raw) && Array.isArray(raw.blocks) ? raw : defaultHomeLayout;
    return <section className="page home-page section">
        <PageBuilder route="/" layout={layout} registry={blockRegistry} featured={featured} works={works}
                     onImageOpen={onImageOpen} pages={settings.nav}/>
    </section>
}
