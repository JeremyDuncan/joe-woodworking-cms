import React from 'react';
import {useImageSrc} from '../lib/media.jsx';

export function HeicPreview({file, alt}) {
    const src = useImageSrc({file, url: null});
    if (!src) return <div className="heic-preview-note">Converting HEIC…</div>;
    return <div className="preview-thumb"><img src={src} alt={alt || file.name}/></div>;
}
