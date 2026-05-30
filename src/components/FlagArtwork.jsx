import React from 'react';
import {Shield} from 'lucide-react';

export function FlagArtwork({variant = 'hero'}) {
    return <div className={`flag-art flag-art--${variant}`} aria-label="stylized wood American flag artwork">
        <div className="flag-canton">{Array.from({length: 24}).map((_, i) => <span key={i}>★</span>)}</div>
        {Array.from({length: 7}).map((_, i) => <div key={i}
                                                    className={`flag-stripe ${i % 2 === 0 ? 'red' : 'cream'}`}/>)}
        <div className="flag-lower-panel"><Shield size={variant === 'hero' ? 82 : 54}/><span>Custom Design Area</span>
        </div>
        <div className="wood-grain"/>
    </div>
}
