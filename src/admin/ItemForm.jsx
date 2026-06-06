import React, {useEffect, useState} from 'react';
import {ImagePlus, Plus, Video} from 'lucide-react';
import {isImageMedia, placementFor, updatePlacementMap} from '../lib/media.jsx';
import {PlacementEditor} from './PlacementEditor.jsx';
import {UploadPreview} from './UploadPreview.jsx';

export function ItemForm({formRef, editing, setEditing, reload, setNotice}) {
    const [title, setTitle] = useState(''), [price, setPrice] = useState(''), [description, setDescription] = useState(''), [files, setFiles] = useState(null), [keep, setKeep] = useState([]), [busy, setBusy] = useState(false), [mediaPlacement, setMediaPlacement] = useState({}), [newMediaPlacement, setNewMediaPlacement] = useState({});
    useEffect(() => {
        setTitle(editing?.title || '');
        setPrice(editing?.price ?? '');
        setDescription(editing?.description || '');
        setKeep((editing?.media || []).map(m => m.url));
        setMediaPlacement(Object.fromEntries((editing?.media || []).filter(isImageMedia).map(m => [m.url, m.placement ?? null])));
        setNewMediaPlacement({});
        setFiles(null);
    }, [editing]);

    async function submit(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const selectedFiles = Array.from(files || []);
        const existingKept = editing ? keep.length : 0;
        if (!title.trim() || !description.trim()) return setNotice({
            type: 'error',
            text: 'Title and description are required.'
        });
        if (existingKept + selectedFiles.length < 1) return setNotice({
            type: 'error',
            text: 'Please add at least one image.'
        });
        setBusy(true);
        setNotice({type: 'success', text: 'Saving...'});
        const fd = new FormData();
        Object.entries({
            title: title.trim(),
            price,
            description: description.trim(),
            keepMedia: keep.join(','),
            mediaPlacement: JSON.stringify(mediaPlacement),
            newMediaPlacement: JSON.stringify(newMediaPlacement)
        }).forEach(([k, v]) => fd.append(k, v));
        selectedFiles.forEach(f => fd.append('media', f));
        const url = editing ? '/api/admin/items/' + editing.id : '/api/admin/items';
        try {
            const r = await fetch(url, {method: editing ? 'PUT' : 'POST', body: fd});
            const j = await r.json().catch(() => ({}));
            if (!r.ok) return setNotice({type: 'error', text: j.error || 'Save failed.'});
            setNotice({type: 'success', text: `Item ${editing ? 'updated' : 'added'} successfully.`});
            setEditing(null);
            setFiles(null);
            setNewMediaPlacement({});
            form.reset();
            await reload();
            formRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
        } catch {
            setNotice({type: 'error', text: 'Network error. Save failed.'});
        } finally {
            setBusy(false);
        }
    }

    return (
        <form ref={formRef} className="item-form" onSubmit={submit} noValidate>
            <p className="eyebrow">
                <Plus size={15} /> {editing ? 'Edit Item' : 'Add A New Item'}
            </p>

            <div className="form-grid">
                <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
                <input placeholder="Price / Quote Text" value={price} onChange={e => setPrice(e.target.value)} />
            </div>

            <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />

            {editing?.media?.length > 0 && (
                <div className="media-keep">
                    <p>Existing media</p>

                    {editing.media.map(m => (
                        <div key={m.url} className="existing-media-editor">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={keep.includes(m.url)}
                                    onChange={e =>
                                        setKeep(e.target.checked ? [...keep, m.url] : keep.filter(x => x !== m.url))
                                    }
                                />

                                {m.type?.startsWith('video/') ? <Video /> : <ImagePlus />}
                                {m.originalName || m.url}
                            </label>

                            {keep.includes(m.url) && isImageMedia(m) && (
                                <PlacementEditor
                                    media={{ ...m, placement: placementFor(mediaPlacement, m.url) }}
                                    value={placementFor(mediaPlacement, m.url) ?? m.placement ?? null}
                                    onChange={next => updatePlacementMap(setMediaPlacement, m.url, next)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            <label className="upload">
                <ImagePlus /> Upload images
                <input
                    type="file"
                    accept="image/*,.heic,.heif"
                    multiple
                    onChange={e => {
                        setFiles(e.target.files);
                        setNewMediaPlacement({});
                    }}
                />
            </label>

            <UploadPreview
                files={files}
                title={title}
                price={price}
                description={description}
                placements={newMediaPlacement}
                setPlacements={setNewMediaPlacement}
            />

            <div className="form-actions">
                <button className="button button-primary" disabled={busy}>
                    {busy ? 'Saving...' : editing ? 'Save changes' : 'Add Item'}
                </button>

                {editing && (
                    <button type="button" className="button button-ghost" onClick={() => setEditing(null)}>
                        Cancel edit
                    </button>
                )}
            </div>
        </form>
    );
}
