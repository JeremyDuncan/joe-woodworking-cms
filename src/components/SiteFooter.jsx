import React from 'react';
import {PageBuilder} from '../blocks/PageBuilder.jsx';
import {blockRegistry} from '../blocks/registry.jsx';
import {defaultSettings} from '../data/defaults.js';

// The footer is a global block layout stored at settings.layout['__footer__'],
// so it persists across every page just like the header. It's edited in place
// with the same block builder used for pages.
export const FOOTER_KEY = '__footer__';

export function SiteFooter({settings, works, onImageOpen}) {
    const raw = settings.layout?.[FOOTER_KEY] ?? defaultSettings.layout[FOOTER_KEY];
    const layout = raw && Array.isArray(raw.blocks) ? raw : {columns: 1, blocks: []};
    return <footer className="site-footer section">
        <PageBuilder route={FOOTER_KEY} layout={layout} registry={blockRegistry}
                     works={works} onImageOpen={onImageOpen} pages={settings.nav} context="footer"/>
    </footer>;
}
