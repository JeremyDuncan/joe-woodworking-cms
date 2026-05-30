import React from 'react';
import {WorkCard} from '../components/WorkCard.jsx';

export function WorkPage({settings, gallery, onImageOpen}) {
    return <section className="page section showcase">
        <div className="section-heading"><p className="eyebrow">{settings.work.eyebrow}</p>
            <h2>{settings.work.title}</h2><p>{settings.work.body}</p></div>
        <div className="gallery-grid gallery-grid--five">{gallery.map((item, i) => <WorkCard key={item.id || item.title}
                                                                                             item={item} i={i}
                                                                                             onImageOpen={onImageOpen}/>)}</div>
    </section>
}
