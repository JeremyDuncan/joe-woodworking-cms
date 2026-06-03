import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';

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

// Placement is a focal-point + zoom model: {fit, x, y, scale}. `x`/`y` are the
// object-position percentages (0–100, 50 = centre), `scale` zooms in from there, and
// `fit` is 'cover' (fill the frame, cropping) or 'contain' (show the whole picture).
// Both the live preview (FocalCanvas) and the rendered image (CropImage) use the exact
// same CSS derived here, so "Adjust image" is truly what-you-see-is-what-you-get.
function clampPct(v, d) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : d;
}

export function normalizeCrop(crop) {
    if (!crop || typeof crop !== 'object') return null;
    let c = crop;
    // Convert the old crop-rectangle shape {x, y, width, height} (percentages of the
    // image) into a focal centre + zoom so existing saved placements still render.
    if (typeof c.scale !== 'number' && typeof c.width === 'number' && c.width > 0) {
        c = {fit: 'cover', x: c.x + c.width / 2, y: c.y + (c.height || c.width) / 2, scale: 100 / c.width};
    }
    if (typeof c.scale !== 'number') return null;
    return {
        fit: c.fit === 'contain' ? 'contain' : 'cover',
        x: clampPct(c.x, 50),
        y: clampPct(c.y, 50),
        scale: Math.max(1, Math.min(8, c.scale)),
    };
}

export function toFocal(crop) {
    return normalizeCrop(crop) || {fit: 'cover', x: 50, y: 50, scale: 1};
}

// The single source of truth for how a placement renders. Used by CropImage AND the
// adjuster preview, so they always match.
//
// Deliberately transform-FREE: a `transform: scale()` promotes the image to a cached GPU
// layer where `object-position` changes silently stop repainting (you'd see zoom update
// but not pan). Instead we size the element to the exact cover/contain dimensions for
// the target frame, then shift that layer from the saved focal point. This keeps pan
// working even at scale=1 in very wide frames.
export function cropStyle(crop, imageAspect, frameAspect) {
    const c = normalizeCrop(crop);
    if (!c) return {objectFit: 'cover'};
    const ia = Number(imageAspect);
    const fa = Number(frameAspect);
    if (!Number.isFinite(ia) || ia <= 0 || !Number.isFinite(fa) || fa <= 0) {
        return {objectFit: c.fit, objectPosition: `${c.x}% ${c.y}%`};
    }
    let width, height;
    if (c.fit === 'contain') {
        if (ia >= fa) {
            width = 100;
            height = 100 * (fa / ia);
        } else {
            width = 100 * (ia / fa);
            height = 100;
        }
    } else if (ia >= fa) {
        width = 100 * (ia / fa);
        height = 100;
    } else {
        width = 100;
        height = 100 * (fa / ia);
    }
    width *= c.scale;
    height *= c.scale;
    const left = ((100 - width) * (c.x / 100)).toFixed(2);
    const top = ((100 - height) * (c.y / 100)).toFixed(2);
    // maxWidth/Height none so the frame's `max-*: 100%` doesn't clamp the zoom away.
    return {
        position: 'absolute', objectFit: 'fill', objectPosition: 'center',
        maxWidth: 'none', maxHeight: 'none',
        width: `${width.toFixed(2)}%`, height: `${height.toFixed(2)}%`, left: `${left}%`, top: `${top}%`,
    };
}

function useFrameAspect(ref) {
    const [aspect, setAspect] = useState(null);
    useLayoutEffect(() => {
        const el = ref.current?.parentElement;
        if (!el) return;
        const update = () => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) setAspect(r.width / r.height);
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return aspect;
}

export function CropImage({src, alt, crop}) {
    const ref = useRef(null);
    const frameAspect = useFrameAspect(ref);
    const [imageAspect, setImageAspect] = useState(null);
    if (!src) return null;
    return <img ref={ref} src={src} alt={alt} className="item-media"
                onLoad={e => {
                    const img = e.currentTarget;
                    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                        setImageAspect(img.naturalWidth / img.naturalHeight);
                    }
                }}
                style={cropStyle(crop, imageAspect, frameAspect)}/>;
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
