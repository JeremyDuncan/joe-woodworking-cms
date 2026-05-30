import React, {useEffect, useMemo, useState} from 'react';
import {BadgeCheck} from 'lucide-react';
import {isHeicFile, isImageMedia, placementFor, updatePlacementMap} from '../lib/media.jsx';
import {WorkCard} from '../components/WorkCard.jsx';
import {HeicPreview} from './HeicPreview.jsx';
import {PlacementEditor} from './PlacementEditor.jsx';

export function UploadPreview({files, title, price, description, placements, setPlacements}) {
    // Metadata only — no side effects during render. A per-file key (name + lastModified + index)
    // keeps React rows distinct even when two selected files share the same name.
    const previews = useMemo(() => Array.from(files || []).map((f, i) => ({
        file: f,
        type: f.type || (isHeicFile(f) ? 'image/heic' : ''),
        originalName: f.name,
        key: `${f.name}-${f.lastModified}-${i}`,
    })), [files]);

    // Create/revoke object URLs in an effect so discarded renders (e.g. Strict Mode) can't leak them.
    const [urls, setUrls] = useState({});
    useEffect(() => {
        const created = {};
        previews.forEach(p => {
            if (!isHeicFile(p.file)) created[p.key] = URL.createObjectURL(p.file);
        });
        setUrls(created);
        return () => Object.values(created).forEach(u => URL.revokeObjectURL(u));
    }, [previews]);

    if (!previews.length) return null;
    return <div className="upload-preview">
        <p className="success"><BadgeCheck size={16}/> {previews.length} file{previews.length > 1 ? 's' : ''} ready. Crop and reposition images below, then click save.</p>
        <div className="preview-grid">{previews.map(p => <div key={p.key} className="preview-frame">
            {p.type.startsWith('video/') ? <video src={urls[p.key]} controls muted/> : isHeicFile(p.file) ?
                <HeicPreview file={p.file} alt={p.file.name}/> :
                <div className="preview-thumb"><img src={urls[p.key]} alt={p.file.name}/></div>}
            <span>{p.file.name}</span>
            {isImageMedia(p) && <PlacementEditor
                media={{...p, url: urls[p.key]}}
                value={placementFor(placements, p.file.name)}
                onChange={next => updatePlacementMap(setPlacements, p.file.name, next)}/>}
        </div>)}</div>
        <WorkCard i={0} item={{
            title: title || 'New work title',
            price: price || 'Price / quote text',
            description: description || 'Description will appear here after saving.',
            media: previews.filter(p => !isHeicFile(p.file)).map(p => ({
                url: urls[p.key],
                type: p.type,
                originalName: p.file.name,
                placement: placementFor(placements, p.file.name)
            }))
        }}/>
    </div>;
}
