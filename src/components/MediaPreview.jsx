import React from 'react';
import {CropImage} from '../lib/media.jsx';
import {FlagArtwork} from './FlagArtwork.jsx';
import {Link} from '../lib/navigation.jsx';

export function MediaPreview({media, compact = false, onImageOpen, linkTo}) {
    const first = media?.[0];
    if (!first) return <div className="media-frame"><FlagArtwork variant={compact ? 'card' : 'hero'}/></div>;
    if (first.type?.startsWith('video/')) return <div className="media-frame">
        <video className="work-media" src={first.url} controls muted playsInline/>
    </div>;
    const inner = <CropImage src={first.url} alt={first.originalName || 'Custom flag work'} crop={first.placement}/>;
    if (linkTo) return <Link to={linkTo} className="media-frame media-frame-link" aria-label="Open linked page">
        {inner}
    </Link>;
    return <button type="button" className="media-frame media-frame-button" aria-label="Open larger image"
                   onClick={() => onImageOpen?.(first)}>
        {inner}
    </button>;
}
