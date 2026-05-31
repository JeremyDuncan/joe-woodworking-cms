import React, {useState} from 'react';
import {Link} from '../lib/navigation.jsx';
import {MediaPreview} from '../components/MediaPreview.jsx';
import {InlineText} from '../lib/edit.jsx';
import {DynamicIcon} from '../lib/icons.jsx';
import {IconControl} from '../components/IconPicker.jsx';

function Eyebrow({block, setProp, editing}) {
    return <p className="eyebrow"><DynamicIcon className="ui-icon" name={block.props.icon || 'Star'} size={15}/> {editing
        ? <InlineText value={block.props.text} placeholder="Eyebrow" onChange={v => setProp('text', v)}/>
        : block.props.text}</p>;
}

function Heading({block, setProp, editing}) {
    const Tag = `h${block.props.level || 2}`;
    if (!editing) return <Tag>{block.props.text}</Tag>;
    return <InlineText as={Tag} value={block.props.text} placeholder="Heading" onChange={v => setProp('text', v)}/>;
}

function Text({block, setProp, editing}) {
    if (!editing) return <p>{block.props.text}</p>;
    return <InlineText as="p" value={block.props.text} placeholder="Paragraph" onChange={v => setProp('text', v)}/>;
}

function ButtonBlock({block, setProp, editing}) {
    const cls = `button button-${block.props.variant === 'ghost' ? 'ghost' : 'primary'}`;
    const icon = block.props.icon ? <DynamicIcon className="ui-icon" name={block.props.icon} size={18}/> : null;
    if (!editing) return <Link to={block.props.to || '/'} className={cls}>{block.props.label}{icon}</Link>;
    return <span className={cls}><InlineText value={block.props.label} placeholder="Button text"
                                             onChange={v => setProp('label', v)}/>{icon}</span>;
}

function ListBlock({block, setProp, editing}) {
    const items = block.props.items || [];
    const bullet = block.props.icon || 'BadgeCheck';
    return <div className="proof-strip">
        {items.map((it, i) => <span key={i}><DynamicIcon className="ui-icon" name={bullet} size={16}/>
            {editing
                ? <InlineText value={it} placeholder="Item"
                              onChange={v => setProp('items', items.map((x, j) => j === i ? v : x))}/>
                : it}
            {editing && <button type="button" className="chip-remove" title="Remove"
                                onClick={() => setProp('items', items.filter((_, j) => j !== i))}>×</button>}
        </span>)}
        {editing && <button type="button" className="chip-add"
                            onClick={() => setProp('items', [...items, 'New item'])}>+ Add</button>}
    </div>;
}

function ImageUpload({hasImage, onUploaded, onClear, clearLabel}) {
    const [busy, setBusy] = useState(false);

    async function onChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const r = await fetch('/api/admin/upload', {method: 'POST', body: fd});
            const j = await r.json().catch(() => ({}));
            if (r.ok && j.url) onUploaded(j.url);
            else alert(j.error || 'Upload failed.');
        } catch {
            alert('Network error. Upload failed.');
        } finally {
            setBusy(false);
            e.target.value = '';
        }
    }

    return <div className="image-upload">
        <label className="button button-ghost">{busy ? 'Uploading…' : (hasImage ? 'Replace image' : 'Upload image')}
            <input type="file" accept="image/*,.heic,.heif" onChange={onChange}/></label>
        {hasImage && onClear && clearLabel &&
            <button type="button" className="button button-ghost" onClick={onClear}>{clearLabel}</button>}
    </div>;
}

function ImageBlock({block, setProp, editing, featured, onImageOpen}) {
    const url = block.props.url;
    const media = url ? [{url, type: 'image/*'}] : (featured?.media || []);
    return <div className="home-visual">
        <MediaPreview media={media} onImageOpen={onImageOpen}/>
        {editing && <ImageUpload hasImage={!!url} clearLabel="Use featured" onUploaded={u => setProp('url', u)}
                                 onClear={() => setProp('url', '')}/>}
    </div>;
}

// A single portfolio item. Self-contained (its own title/description/price/image),
// so each work on the page is its own block. The image is required to save.
function WorkItemBlock({block, setProp, editing, onImageOpen}) {
    const {title, description, price, image} = block.props;
    const media = image ? [{url: image, type: 'image/*'}] : [];
    return <article className="gallery-card work-card">
        <MediaPreview media={media} compact onImageOpen={onImageOpen}/>
        <div className="card-copy">
            {editing
                ? <InlineText as="h3" value={title} placeholder="Title" onChange={v => setProp('title', v)}/>
                : <h3>{title}</h3>}
            {editing
                ? <InlineText className="price-tag" value={price} placeholder="Price / quote (optional)"
                              onChange={v => setProp('price', v)}/>
                : (price ? <p className="price-tag">{price}</p> : null)}
            {editing
                ? <InlineText as="p" value={description} placeholder="Description"
                              onChange={v => setProp('description', v)}/>
                : <p>{description}</p>}
        </div>
        {editing && <ImageUpload hasImage={!!image} onUploaded={u => setProp('image', u)}/>}
        {editing && !image && <p className="work-img-required">A picture is required before saving.</p>}
    </article>;
}

function headingControls({block, setProp}) {
    return <label className="block-ctl">Size
        <select value={block.props.level || 2} onChange={e => setProp('level', Number(e.target.value))}>
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
        </select>
    </label>;
}

function buttonControls({block, setProp, pages}) {
    const opts = pages || [];
    const known = opts.some(p => p.path === block.props.to);
    return <>
        <label className="block-ctl">Style
            <select value={block.props.variant || 'primary'} onChange={e => setProp('variant', e.target.value)}>
                <option value="primary">Primary</option>
                <option value="ghost">Ghost</option>
            </select>
        </label>
        <label className="block-ctl">Links to
            <select value={block.props.to || ''} onChange={e => setProp('to', e.target.value)}>
                {!known && <option value={block.props.to || ''}>{block.props.to || 'Select page'}</option>}
                {opts.map(p => <option key={p.path} value={p.path}>{p.label}</option>)}
            </select>
        </label>
        <IconControl label="Icon" value={block.props.icon} fallback="ArrowRight" allowNone
                     onChange={v => setProp('icon', v)}/>
    </>;
}

function eyebrowControls({block, setProp}) {
    return <IconControl label="Icon" value={block.props.icon} fallback="Star"
                        onChange={v => setProp('icon', v)}/>;
}

function listControls({block, setProp}) {
    return <IconControl label="Bullet" value={block.props.icon} fallback="BadgeCheck"
                        onChange={v => setProp('icon', v)}/>;
}

// Each block type is self-contained: it carries its own content in `props`, so a
// page can hold any number of them. `defaults` seeds a freshly-added block.
export const blockRegistry = {
    eyebrow: {label: 'Eyebrow', defaults: {text: 'Eyebrow', icon: 'Star'}, render: Eyebrow, controls: eyebrowControls},
    heading: {label: 'Heading', defaults: {text: 'Heading', level: 2}, render: Heading, controls: headingControls},
    text: {label: 'Paragraph', defaults: {text: 'Paragraph text.'}, render: Text},
    button: {label: 'Button', defaults: {label: 'Button', to: '/contact', variant: 'primary'}, render: ButtonBlock, controls: buttonControls},
    list: {label: 'List', defaults: {items: ['Item one', 'Item two'], icon: 'BadgeCheck'}, render: ListBlock, controls: listControls},
    image: {label: 'Image', defaults: {source: 'featured'}, render: ImageBlock},
    work: {
        label: 'Work item',
        defaults: {title: 'New work', description: 'Describe this piece.', price: '', image: ''},
        render: WorkItemBlock
    },
};
