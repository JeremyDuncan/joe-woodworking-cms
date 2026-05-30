import React, {useEffect} from 'react';
import {X} from 'lucide-react';

export function ImageModal({image, onClose}) {
    useEffect(() => {
        if (!image) return undefined;
        const onKeyDown = e => {
            if (e.key === 'Escape') onClose();
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [image, onClose]);
    if (!image) return null;
    return <div className="image-modal-backdrop" role="dialog" aria-modal="true" aria-label="View full-size image"
                onClick={onClose}>
        <button className="image-modal-close" type="button" aria-label="Close full-size image" onClick={onClose}><X
            size={24}/></button>
        <img className="image-modal-img" src={image.url} alt={image.originalName || 'Full-size custom flag work'}
             onClick={e => e.stopPropagation()}/>
    </div>;
}
