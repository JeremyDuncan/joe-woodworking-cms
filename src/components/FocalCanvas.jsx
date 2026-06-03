import React, {useRef, useState} from 'react';
import {cropStyle, toFocal} from '../lib/media.jsx';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// A controlled drag-to-reposition / scroll-to-zoom surface. It renders the image with
// the *exact* same CSS the live site uses (via cropStyle), and is shaped to the target
// frame's aspect ratio — so what you arrange here is what gets rendered. `value` is the
// {fit, x, y, scale} placement; `onChange` receives the updated placement live.
export function FocalCanvas({src, value, aspect = 0.86, onChange, className = 'adjust-canvas'}) {
    const boxRef = useRef(null);
    const drag = useRef(null);
    const pos = toFocal(value);
    const [imageAspect, setImageAspect] = useState(null);

    function onPointerDown(e) {
        if (e.button != null && e.button !== 0) return;
        e.preventDefault();
        const box = boxRef.current.getBoundingClientRect();
        drag.current = {sx: e.clientX, sy: e.clientY, x: pos.x, y: pos.y, w: box.width, h: box.height, base: pos};
        boxRef.current.setPointerCapture?.(e.pointerId);
    }

    function onPointerMove(e) {
        const d = drag.current;
        if (!d) return;
        // Dragging the picture one way reveals the opposite edge, so the focal point moves
        // against the drag. Divide by scale so a zoomed-in image pans more precisely.
        const dx = (e.clientX - d.sx) / d.w * 100 / d.base.scale;
        const dy = (e.clientY - d.sy) / d.h * 100 / d.base.scale;
        onChange({...d.base, x: clamp(d.x - dx, 0, 100), y: clamp(d.y - dy, 0, 100)});
    }

    function onPointerUp(e) {
        drag.current = null;
        boxRef.current?.releasePointerCapture?.(e.pointerId);
    }

    function onWheel(e) {
        e.preventDefault();
        onChange({...pos, scale: clamp(pos.scale + (e.deltaY < 0 ? 0.12 : -0.12), 1, 8)});
    }

    return <div ref={boxRef} className={className} style={{'--ar': aspect}}
                onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp} onWheel={onWheel}>
        <img src={src} alt="" className="adjust-img" draggable={false}
             onLoad={e => {
                 const img = e.currentTarget;
                 if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                     setImageAspect(img.naturalWidth / img.naturalHeight);
                 }
             }}
             style={cropStyle(pos, imageAspect, aspect)}/>
    </div>;
}
