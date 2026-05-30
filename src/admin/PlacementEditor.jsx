import React, {useCallback, useState} from 'react';
import Cropper from 'react-easy-crop';
import {isImageMedia, useImageSrc} from '../lib/media.jsx';

export function PlacementEditor({media, value, onChange}) {
    if (!isImageMedia(media)) return null;
    const imgSrc = useImageSrc(media);
    const [crop, setCrop] = useState({x: 0, y: 0});
    const [zoom, setZoom] = useState(1);
    const onCropComplete = useCallback((pct) => onChange(pct), [onChange]);

    if (!imgSrc) return <div className="heic-preview-note">Loading preview…</div>;

    return (
        <div className="placement-editor">
            <div className="placement-canvas">
                <Cropper
                    image={imgSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={0.86}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    initialCroppedAreaPercentages={value?.width ? value : undefined}
                    showGrid={false}
                    style={{containerStyle: {background: '#050912'}}}
                />
            </div>
            <div className="placement-editor-bar">
                <span>Drag to reposition · Scroll or pinch to zoom</span>
                <button type="button" className="button button-ghost"
                        onClick={() => { setCrop({x: 0, y: 0}); setZoom(1); onChange(null); }}>
                    Reset crop
                </button>
            </div>
        </div>
    );
}
