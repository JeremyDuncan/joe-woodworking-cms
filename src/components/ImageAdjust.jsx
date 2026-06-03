import React, {useState} from 'react';
import {createPortal} from 'react-dom';
import {FocalCanvas} from './FocalCanvas.jsx';
import {toFocal} from '../lib/media.jsx';

// Reposition / zoom an image to suit its frame. The preview is shaped to the frame's
// real aspect ratio and rendered with the same CSS the site uses, so Apply produces
// exactly what's shown here. Stores a {fit, x, y, scale} placement.
export function ImageAdjust({src, value, aspect = 0.86, onApply, onClose}) {
    const [pos, setPos] = useState(() => toFocal(value));

    return createPortal(<div className="icon-modal-backdrop" onMouseDown={onClose}>
        <div className="adjust-modal" onMouseDown={e => e.stopPropagation()}>
            <FocalCanvas src={src} value={pos} aspect={aspect} onChange={setPos}/>
            <div className="adjust-controls">
                <div className="adjust-fit" role="group" aria-label="Fit mode">
                    <button type="button" className={pos.fit === 'cover' ? 'active' : ''}
                            onClick={() => setPos(p => ({...p, fit: 'cover'}))}>Fill</button>
                    <button type="button" className={pos.fit === 'contain' ? 'active' : ''}
                            onClick={() => setPos(p => ({...p, fit: 'contain'}))}>Fit</button>
                </div>
                <label className="adjust-zoom-wrap">
                    <span>Zoom</span>
                    <input type="range" className="adjust-zoom" min="1" max="5" step="0.01" value={pos.scale}
                           onChange={e => setPos(p => ({...p, scale: Number(e.target.value)}))}/>
                </label>
                <button type="button" className="button button-ghost adjust-reset"
                        onClick={() => setPos({fit: 'cover', x: 50, y: 50, scale: 1})}>Reset</button>
            </div>
            <div className="adjust-bar">
                <span className="adjust-hint">Drag to reposition · scroll or slider to zoom</span>
                <button type="button" className="button button-ghost" onClick={onClose}>Cancel</button>
                <button type="button" className="button button-primary" onClick={() => {
                    onApply(pos);
                    onClose();
                }}>Apply
                </button>
            </div>
        </div>
    </div>, document.body);
}
