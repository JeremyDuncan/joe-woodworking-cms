import React from 'react';
import {WorkCard} from '../components/WorkCard.jsx';
import {Edit} from '../lib/edit.jsx';

export function WorkPage({settings, gallery, onImageOpen}) {
    return <section className="page section showcase">
        <div className="section-heading">
            <Edit as="p" className="eyebrow" path={['work', 'eyebrow']} value={settings.work.eyebrow}
                  placeholder="Eyebrow"/>
            <Edit as="h2" path={['work', 'title']} value={settings.work.title} placeholder="Title"/>
            <Edit as="p" path={['work', 'body']} value={settings.work.body} placeholder="Body"/>
        </div>
        <div className="gallery-grid gallery-grid--five">{gallery.map((item, i) => <WorkCard key={item.id || item.title}
                                                                                             item={item} i={i}
                                                                                             onImageOpen={onImageOpen}/>)}</div>
    </section>
}
