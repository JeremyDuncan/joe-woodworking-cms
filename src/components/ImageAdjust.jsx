import React, {useCallback, useState} from 'react';
import {createPortal} from 'react-dom';
import Cropper from 'react-easy-crop';

// Crop / reposition / zoom an image. Stores croppedAreaPercentages (the same
// `placement` shape CropImage renders).
export function ImageAdjust({src, value, aspect = 0.86, onApply, onClose}) {
    const [crop, setCrop] = useState({x: 0, y: 0});
    const [zoom, setZoom] = useState(1);
    const [area, setArea] = useState(value || null);
    const onComplete = useCallback(pct => setArea(pct), []);

    return createPortal(<div className="icon-modal-backdrop" onMouseDown={onClose}>
        <div className="adjust-modal" onMouseDown={e => e.stopPropagation()}>
            <div className="adjust-canvas">
                <Cropper image={src} crop={crop} zoom={zoom} aspect={aspect}
                         onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onComplete}
                         initialCroppedAreaPercentages={value?.width ? value : undefined}
                         showGrid={false} style={{containerStyle: {background: '#050912'}}}/>
            </div>
            <div className="adjust-bar">
                <span className="adjust-hint">Drag to reposition · scroll to zoom</span>
                <button type="button" className="button button-ghost" onClick={onClose}>Cancel</button>
                <button type="button" className="button button-primary" onClick={() => {
                    onApply(area);
                    onClose();
                }}>Apply
                </button>
            </div>
        </div>
    </div>, document.body);
}
