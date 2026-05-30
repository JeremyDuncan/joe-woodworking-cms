import React from 'react';
import {Medal, Sparkles} from 'lucide-react';
import {MediaPreview} from '../components/MediaPreview.jsx';
import {Edit, InlineText, useEdit} from '../lib/edit.jsx';

export function OptionsPage({settings, featured, onImageOpen}) {
    const {editing, setField} = useEdit();
    const items = settings.options.items || [];
    return <section className="page section options-section">
        <div className="real-work-callout"><MediaPreview media={featured?.media} onImageOpen={onImageOpen}/>
            <div><p className="eyebrow">Actual work examples</p><h2>{settings.work.title}</h2>
                <p>{settings.work.body}</p></div>
        </div>
        <div className="split">
            <div>
                <p className="eyebrow"><Sparkles size={15}/> <Edit path={['options', 'eyebrow']}
                                                                   value={settings.options.eyebrow}
                                                                   placeholder="Eyebrow"/></p>
                <Edit as="h2" path={['options', 'title']} value={settings.options.title} placeholder="Title"/>
                <Edit as="p" path={['options', 'body']} value={settings.options.body} placeholder="Body"/>
            </div>
            <div className="option-list">
                {items.map((option, idx) => <div className="option-item" key={idx}><Medal size={20}/>
                    {editing
                        ? <InlineText value={option} placeholder="Option"
                                      onChange={v => setField(['options', 'items'], items.map((x, j) => j === idx ? v : x))}/>
                        : <span>{option}</span>}
                    {editing && <button type="button" className="chip-remove" title="Remove"
                                        onClick={() => setField(['options', 'items'], items.filter((_, j) => j !== idx))}>×</button>}
                </div>)}
                {editing && <button type="button" className="chip-add"
                                    onClick={() => setField(['options', 'items'], [...items, 'New option'])}>+ Add
                    option</button>}
            </div>
        </div>
    </section>
}
