import React, {useEffect, useState} from 'react';

export function placementFor(map, key) {
    return map?.[key] ?? null;
}

export function updatePlacementMap(setter, key, value) {
    setter(prev => ({...prev, [key]: value}));
}

export function isImageMedia(m) {
    return m?.type?.startsWith('image/') || /\.hei[cf]$/i.test(m?.originalName || m?.url || '');
}

export function isHeicFile(f) {
    return /\.hei[cf]$/i.test(f?.name || '') || f?.type === 'image/heic' || f?.type === 'image/heif';
}

export function CropImage({src, alt, crop}) {
    if (!src) return null;
    if (!crop || typeof crop.width !== 'number' || crop.width <= 0) {
        return <img src={src} alt={alt} className="work-media" style={{objectFit: 'cover'}}/>;
    }
    return <img
        src={src}
        alt={alt}
        className="work-media"
        style={{
            objectFit: 'fill',
            transformOrigin: '0 0',
            transform: `scale(${(100 / crop.width).toFixed(4)}, ${(100 / crop.height).toFixed(4)}) translate(${(-crop.x).toFixed(2)}%, ${(-crop.y).toFixed(2)}%)`,
        }}
    />;
}

export function useImageSrc(media) {
    const [src, setSrc] = useState(!isHeicFile(media?.file) ? (media?.url || null) : null);
    useEffect(() => {
        if (!isHeicFile(media?.file)) { setSrc(media?.url || null); return; }
        let cancelled = false;
        let objectUrl = null;
        const controller = new AbortController();
        const fd = new FormData();
        fd.append('file', media.file);
        fetch('/api/admin/preview-convert', {method: 'POST', body: fd, signal: controller.signal})
            .then(r => r.ok ? r.blob() : Promise.reject())
            .then(blob => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setSrc(objectUrl);
            })
            .catch(() => { if (!cancelled) setSrc(null); });
        return () => {
            cancelled = true;
            controller.abort();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [media?.file, media?.url]);
    return src;
}
