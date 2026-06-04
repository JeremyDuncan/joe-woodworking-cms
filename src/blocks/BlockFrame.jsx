import React from 'react';
import {GripVertical, X} from 'lucide-react';

export function BlockFrame({label, handleProps, handleRef, onRemove, extra, wrapActions, dragOverlay, children}) {
    return <div className={`block-frame${dragOverlay ? ' is-overlay' : ''}`}>
        <div className="block-frame-bar">
            <span className="block-frame-grip" ref={handleRef} {...(handleProps || {})}
                  data-tip="Drag to move" aria-label="Drag to move">
                <GripVertical size={16}/>
            </span>
            <span className="block-frame-label">{label}</span>
            <div className={`block-frame-actions${wrapActions ? ' block-actions-wrap' : ''}`}>
                {extra}
                {onRemove && <button type="button" className="block-remove-btn" data-tip="Remove block"
                                     aria-label="Remove block" onClick={onRemove}><X size={15}/></button>}
            </div>
        </div>
        <div className="block-frame-body">{children}</div>
    </div>;
}
