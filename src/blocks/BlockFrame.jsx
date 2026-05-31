import React from 'react';
import {GripVertical, X} from 'lucide-react';

export function BlockFrame({label, handleProps, handleRef, onRemove, extra, dragOverlay, children}) {
    return <div className={`block-frame${dragOverlay ? ' is-overlay' : ''}`}>
        <div className="block-frame-bar">
            <span className="block-frame-grip" ref={handleRef} {...(handleProps || {})} title="Drag to move">
                <GripVertical size={16}/>
            </span>
            <span className="block-frame-label">{label}</span>
            <div className="block-frame-actions">
                {extra}
                {onRemove && <button type="button" title="Remove block" onClick={onRemove}><X size={15}/></button>}
            </div>
        </div>
        <div className="block-frame-body">{children}</div>
    </div>;
}
