import React from 'react';
import {CropImage} from '../lib/media.jsx';
import {FlagArtwork} from './FlagArtwork.jsx';

export function MediaPreview({media, compact = false, onImageOpen}) {
    const first = media?.[0];
    if (!first) return <div className="media-frame"><FlagArtwork variant={compact ? 'card' : 'hero'}/></div>;
    if (first.type?.startsWith('video/')) return <div className="media-frame">
        <video className="work-media" src={first.url} controls muted playsInline/>
    </div>;
    return <button type="button" className="media-frame media-frame-button" aria-label="Open larger image"
                   onClick={() => onImageOpen?.(first)}>
        <CropImage src={first.url} alt={first.originalName || 'Custom flag work'} crop={first.placement}/>
    </button>;
}
