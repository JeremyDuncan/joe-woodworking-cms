import React from 'react';
import {ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X} from 'lucide-react';

export function BlockFrame({label, canUp, canDown, canLeft, canRight, onUp, onDown, onLeft, onRight, onRemove, extra, children}) {
    return <div className="block-frame">
        <div className="block-frame-bar">
            <span className="block-frame-label">{label}</span>
            <div className="block-frame-actions">
                {extra}
                <button type="button" title="Move up" disabled={!canUp} onClick={onUp}><ChevronUp size={15}/></button>
                <button type="button" title="Move down" disabled={!canDown} onClick={onDown}><ChevronDown size={15}/>
                </button>
                <button type="button" title="Move to left column" disabled={!canLeft} onClick={onLeft}><ChevronLeft
                    size={15}/></button>
                <button type="button" title="Move to right column" disabled={!canRight} onClick={onRight}><ChevronRight
                    size={15}/></button>
                <button type="button" title="Remove block" onClick={onRemove}><X size={15}/></button>
            </div>
        </div>
        <div className="block-frame-body">{children}</div>
    </div>;
}
