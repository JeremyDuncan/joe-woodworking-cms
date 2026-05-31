import React from 'react';
import {GripVertical, X} from 'lucide-react';

export function BlockFrame({label, isOver, onDragStart, onDragEnd, onDragOver, onDrop, onRemove, extra, children}) {
    return <div className={`block-frame${isOver ? ' drag-over' : ''}`} onDragOver={onDragOver} onDrop={onDrop}>
        <div className="block-frame-bar">
            <span className="block-frame-grip" draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
                  title="Drag to move">
                <GripVertical size={16}/>
            </span>
            <span className="block-frame-label">{label}</span>
            <div className="block-frame-actions">
                {extra}
                <button type="button" title="Remove block" onClick={onRemove}><X size={15}/></button>
            </div>
        </div>
        <div className="block-frame-body">{children}</div>
    </div>;
}
