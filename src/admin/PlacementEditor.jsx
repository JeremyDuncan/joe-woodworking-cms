import React from 'react';
import {FocalCanvas} from '../components/FocalCanvas.jsx';
import {isImageMedia, toFocal, useImageSrc} from '../lib/media.jsx';

// Inline image positioner for the admin item form. Same focal-point + zoom model and
// rendering as the on-page "Adjust image", so the preview matches the live card.
export function PlacementEditor({media, value, onChange}) {
    const imgSrc = useImageSrc(media);
    if (!isImageMedia(media)) return null;
    if (!imgSrc) return <div className="heic-preview-note">Loading preview…</div>;
    const pos = toFocal(value);

    return (
        <div className="placement-editor">
            <div className="placement-editor-bar">
                <div className="adjust-fit" role="group" aria-label="Fit mode">
                    <button type="button" className={pos.fit === 'cover' ? 'active' : ''}
                            onClick={() => onChange({...pos, fit: 'cover'})}>Fill</button>
                    <button type="button" className={pos.fit === 'contain' ? 'active' : ''}
                            onClick={() => onChange({...pos, fit: 'contain'})}>Fit</button>
                </div>
                <input type="range" className="adjust-zoom" min="1" max="5" step="0.01" value={pos.scale}
                       onChange={e => onChange({...pos, scale: Number(e.target.value)})}/>
                <button type="button" className="button button-ghost"
                        onClick={() => onChange(null)}>Reset</button>
            </div>
            <FocalCanvas src={imgSrc} value={value} aspect={0.86} onChange={onChange} className="placement-canvas"/>
        </div>
    );
}
