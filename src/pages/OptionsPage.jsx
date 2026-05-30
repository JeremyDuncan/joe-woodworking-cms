import React from 'react';
import {Medal, Sparkles} from 'lucide-react';
import {MediaPreview} from '../components/MediaPreview.jsx';

export function OptionsPage({settings, featured, onImageOpen}) {
    return <section className="page section options-section">
        <div className="real-work-callout"><MediaPreview media={featured?.media} onImageOpen={onImageOpen}/>
            <div><p className="eyebrow">Actual work examples</p><h2>{settings.work.title}</h2>
                <p>{settings.work.body}</p></div>
        </div>
        <div className="split">
            <div><p className="eyebrow"><Sparkles size={15}/> {settings.options.eyebrow}</p>
                <h2>{settings.options.title}</h2><p>{settings.options.body}</p></div>
            <div className="option-list">{(settings.options.items || []).map((option, idx) => <div className="option-item" key={idx}><Medal size={20}/><span>{option}</span></div>)}</div>
        </div>
    </section>
}
