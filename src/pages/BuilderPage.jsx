import React from 'react';
import {PageBuilder} from '../blocks/PageBuilder.jsx';
import {blockRegistry} from '../blocks/registry.jsx';

// Generic block-driven page. Every route renders through this, reading its layout
// from settings.layout[route] (an empty layout for brand-new pages).
export function BuilderPage({route, settings, featured, works, onImageOpen}) {
    const raw = settings.layout?.[route];
    const layout = raw && Array.isArray(raw.blocks) ? raw : {columns: 1, blocks: []};
    return <section className="page builder-page section">
        <PageBuilder route={route} layout={layout} registry={blockRegistry} featured={featured}
                     works={works} onImageOpen={onImageOpen} pages={settings.nav}/>
    </section>
}
