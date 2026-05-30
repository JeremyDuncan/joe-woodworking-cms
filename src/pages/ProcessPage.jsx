import React from 'react';
import {Edit, InlineText, useEdit} from '../lib/edit.jsx';

export function ProcessPage({settings}) {
    const {editing, setField} = useEdit();
    const steps = settings.process.steps || [];
    return <section className="page section process-section">
        <div className="section-heading narrow">
            <Edit as="p" className="eyebrow" path={['process', 'eyebrow']} value={settings.process.eyebrow}
                  placeholder="Eyebrow"/>
            <Edit as="h2" path={['process', 'title']} value={settings.process.title} placeholder="Title"/>
        </div>
        <div className="process-grid">{steps.map((step, i) => <article key={i}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            {editing
                ? <>
                    <InlineText as="h3" value={step.title} placeholder="Step title"
                                onChange={v => setField(['process', 'steps'], steps.map((s, j) => j === i ? {...s, title: v} : s))}/>
                    <InlineText as="p" value={step.body} placeholder="Step description"
                                onChange={v => setField(['process', 'steps'], steps.map((s, j) => j === i ? {...s, body: v} : s))}/>
                    <button type="button" className="chip-remove wide"
                            onClick={() => setField(['process', 'steps'], steps.filter((_, j) => j !== i))}>× Remove
                        step</button>
                </>
                : <><h3>{step.title}</h3><p>{step.body}</p></>}
        </article>)}
            {editing && <button type="button" className="chip-add"
                                onClick={() => setField(['process', 'steps'], [...steps, {
                                    title: 'New step',
                                    body: 'Describe this step.'
                                }])}>+ Add step</button>}
        </div>
    </section>
}
