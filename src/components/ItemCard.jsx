import React from 'react';
import {MediaPreview} from './MediaPreview.jsx';

export function ItemCard({item, i, onImageOpen}) {
    return <article className="gallery-card item-card">
        <div className="card-number">{String(i + 1).padStart(2, '0')}</div>
        <MediaPreview media={item.media} compact onImageOpen={onImageOpen}/>
        <div className="card-copy"><h3>{item.title}</h3>{item.price && <p className="price-tag">{item.price}</p>}
            <p>{item.description}</p></div>
    </article>
}
