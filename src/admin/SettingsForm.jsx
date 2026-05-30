import React, {useEffect, useState} from 'react';
import {Save} from 'lucide-react';

export function SettingsForm({settings, reloadSettings}) {
    const [draft, setDraft] = useState(settings), [message, setMessage] = useState('');
    useEffect(() => setDraft(settings), [settings]);
    const set = (path, value) => setDraft(d => {
        const n = structuredClone(d);
        let cur = n;
        path.slice(0, -1).forEach(k => cur = cur[k]);
        cur[path.at(-1)] = value;
        return n;
    });

    async function save(e) {
        e.preventDefault();
        setMessage('Saving...');
        const r = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(draft)
        });
        if (!r.ok) {
            setMessage('Save failed');
            return;
        }
        setMessage('Website text saved.');
        reloadSettings();
    }

    return <form className="work-form settings-form" onSubmit={save}><p className="eyebrow"><Save size={15}/> Customize
        website text and pages</p>
        <div className="form-grid"><input value={draft.brandName || ''}
                                          onChange={e => set(['brandName'], e.target.value)}
                                          placeholder="Brand name"/><input value={draft.brandShort || ''}
                                                                           onChange={e => set(['brandShort'], e.target.value)}
                                                                           placeholder="Short brand"/><input
            value={draft.email || ''} onChange={e => set(['email'], e.target.value)} placeholder="Email"/><input
            value={draft.phone || ''} onChange={e => set(['phone'], e.target.value)} placeholder="Phone"/></div>
        {['home', 'work', 'options', 'process', 'contact'].map(section => <fieldset key={section}>
            <legend>{section} page/section</legend>
            {draft[section]?.eyebrow !== undefined &&
                <input value={draft[section].eyebrow || ''} onChange={e => set([section, 'eyebrow'], e.target.value)}
                       placeholder="Eyebrow"/>}<input value={draft[section]?.title || ''}
                                                      onChange={e => set([section, 'title'], e.target.value)}
                                                      placeholder="Title"/>{draft[section]?.body !== undefined &&
            <textarea value={draft[section].body || ''} onChange={e => set([section, 'body'], e.target.value)}
                      placeholder="Body text"/>}</fieldset>)}
        <fieldset>
            <legend>Options list</legend>
            <textarea value={(draft.options?.items || []).join('\n')}
                      onChange={e => set(['options', 'items'], e.target.value.split('\n').filter(Boolean))}/></fieldset>
        <fieldset>
            <legend>Process steps</legend>
            {(draft.process?.steps || []).map((step, i) => <div className="step-edit" key={i}><input value={step.title}
                                                                                                     onChange={e => {
                                                                                                         const steps = [...(draft.process.steps || [])];
                                                                                                         steps[i] = {
                                                                                                             ...steps[i],
                                                                                                             title: e.target.value
                                                                                                         };
                                                                                                         set(['process', 'steps'], steps)
                                                                                                     }}/><textarea
                value={step.body} onChange={e => {
                const steps = [...(draft.process.steps || [])];
                steps[i] = {...steps[i], body: e.target.value};
                set(['process', 'steps'], steps)
            }}/></div>)}</fieldset>
        {message && <p className={message.includes('failed') ? 'error' : 'success'}>{message}</p>}
        <button className="button button-primary">Save website text</button>
    </form>
}
