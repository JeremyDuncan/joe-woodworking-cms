import React, {useEffect, useMemo} from 'react';
import {BadgeCheck} from 'lucide-react';
import {isHeicFile, isImageMedia, placementFor, updatePlacementMap} from '../lib/media.jsx';
import {WorkCard} from '../components/WorkCard.jsx';
import {HeicPreview} from './HeicPreview.jsx';
import {PlacementEditor} from './PlacementEditor.jsx';

export function UploadPreview({files, title, price, description, placements, setPlacements}) {
    const previews = useMemo(() => Array.from(files || []).map(f => ({
        file: f,
        url: isHeicFile(f) ? null : URL.createObjectURL(f),
        type: f.type || (isHeicFile(f) ? 'image/heic' : ''),
        originalName: f.name,
    })), [files]);
    useEffect(() => () => previews.forEach(p => p.url && URL.revokeObjectURL(p.url)), [previews]);
    if (!previews.length) return null;
    return <div className="upload-preview">
        <p className="success"><BadgeCheck size={16}/> {previews.length} file{previews.length > 1 ? 's' : ''} ready. Crop and reposition images below, then click save.</p>
        <div className="preview-grid">{previews.map(p => <div key={p.originalName} className="preview-frame">
            {p.type.startsWith('video/') ? <video src={p.url} controls muted/> : isHeicFile(p.file) ?
                <HeicPreview file={p.file} alt={p.file.name}/> :
                <div className="preview-thumb"><img src={p.url} alt={p.file.name}/></div>}
            <span>{p.file.name}</span>
            {isImageMedia(p) && <PlacementEditor
                media={p}
                value={placementFor(placements, p.file.name)}
                onChange={next => updatePlacementMap(setPlacements, p.file.name, next)}/>}
        </div>)}</div>
        <WorkCard i={0} item={{
            title: title || 'New work title',
            price: price || 'Price / quote text',
            description: description || 'Description will appear here after saving.',
            media: previews.filter(p => !isHeicFile(p.file)).map(p => ({
                url: p.url,
                type: p.type,
                originalName: p.file.name,
                placement: placementFor(placements, p.file.name)
            }))
        }}/>
    </div>;
}
