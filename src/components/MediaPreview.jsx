import React from 'react';
import {CropImage} from '../lib/media.jsx';
import {FlagArtwork} from './FlagArtwork.jsx';
import {Link} from '../lib/navigation.jsx';
import {keyFromUrl, useProcessing} from '../lib/processing.jsx';

export function MediaPreview({media, compact = false, onImageOpen, linkTo}) {
    const {keys, progress} = useProcessing();
    const first = media?.[0];
    if (!first) return <div className="media-frame"><FlagArtwork variant={compact ? 'card' : 'hero'}/></div>;
    if (first.type?.startsWith('video/')) {
        const key = keyFromUrl(first.url);
        const processing = keys.has(key);
        const pct = Math.round((progress?.[key] ?? 0) * 100);
        return <div className="media-frame">
            {/* Key by processing state so the element remounts (and reloads the optimized file)
                the moment transcoding finishes. */}
            <video key={processing ? 'p' : 'r'} className="item-media" src={first.url}
                   controls muted playsInline preload="metadata"/>
            {processing &&
                <span className="media-processing" title="Optimizing this video for faster streaming. It updates automatically when ready.">
                    <span className="media-processing-row">
                        <span className="media-processing-dot"/> Optimizing video{pct > 0 ? `… ${pct}%` : '…'}
                    </span>
                    {pct > 0 && <span className="media-processing-bar"><span style={{width: `${pct}%`}}/></span>}
                </span>}
        </div>;
    }
    const inner = <CropImage src={first.url} alt={first.originalName || 'Custom flag work'} crop={first.placement}/>;
    if (linkTo) return <Link to={linkTo} className="media-frame media-frame-link" aria-label="Open linked page">
        {inner}
    </Link>;
    // stopPropagation so a clickable parent (e.g. a card linking to a page) doesn't
    // also fire when the picture is clicked to open the lightbox.
    return <button type="button" className="media-frame media-frame-button" aria-label="Open larger image"
                   onClick={e => {
                       e.stopPropagation();
                       onImageOpen?.(first);
                   }}>
        {inner}
    </button>;
}
