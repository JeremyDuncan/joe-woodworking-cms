import React, {useState} from 'react';
import {Link} from '../lib/navigation.jsx';
import {MediaPreview} from '../components/MediaPreview.jsx';
import {WorkCard} from '../components/WorkCard.jsx';
import {InlineText} from '../lib/edit.jsx';
import {EditableIcon} from '../components/IconPicker.jsx';

function Eyebrow({block, setProp, editing}) {
    return <p className="eyebrow">
        <EditableIcon className="ui-icon" name={block.props.icon} fallback="Star" size={15} editing={editing}
                      onChange={v => setProp('icon', v)}/>{' '}
        {editing
            ? <InlineText value={block.props.text} placeholder="Eyebrow" onChange={v => setProp('text', v)}/>
            : block.props.text}
    </p>;
}

function Heading({block, setProp, editing}) {
    const Tag = `h${block.props.level || 2}`;
    if (editing) return <InlineText as={Tag} value={block.props.text} placeholder="Heading"
                                    onChange={v => setProp('text', v)}/>;
    const el = <Tag>{block.props.text}</Tag>;
    return block.props.to ? <Link to={block.props.to} className="block-link">{el}</Link> : el;
}

function Text({block, setProp, editing}) {
    if (!editing) return <p>{block.props.text}</p>;
    return <InlineText as="p" value={block.props.text} placeholder="Paragraph" onChange={v => setProp('text', v)}/>;
}

function ButtonBlock({block, setProp, editing}) {
    const variant = block.props.variant || 'primary';
    const cls = variant === 'link' ? 'text-link' : `button button-${variant === 'ghost' ? 'ghost' : 'primary'}`;
    const iconEl = <EditableIcon className="ui-icon" name={block.props.icon} fallback="ArrowRight" size={18}
                                 editing={editing} allowNone onChange={v => setProp('icon', v)}/>;
    if (!editing) return <Link to={block.props.to || '/'} className={cls}>{block.props.label}{iconEl}</Link>;
    return <span className={cls}><InlineText value={block.props.label} placeholder="Button text"
                                             onChange={v => setProp('label', v)}/>{iconEl}</span>;
}

// List items may be strings (legacy) or {text, icon}. Each item's icon is click-to-edit.
function ListBlock({block, setProp, editing}) {
    const items = block.props.items || [];
    const bullet = block.props.icon || 'BadgeCheck';
    const norm = raw => (typeof raw === 'string' ? {text: raw} : (raw || {}));
    const update = (i, patch) => setProp('items', items.map((x, j) => j === i ? {...norm(x), ...patch} : x));
    return <div className="proof-strip">
        {items.map((raw, i) => {
            const it = norm(raw);
            return <span key={i}>
                <EditableIcon className="ui-icon" name={it.icon} fallback={bullet} size={16} editing={editing}
                              onChange={v => update(i, {icon: v})}/>
                {editing
                    ? <InlineText value={it.text} placeholder="Item" onChange={v => update(i, {text: v})}/>
                    : it.text}
                {editing && <button type="button" className="chip-remove" title="Remove"
                                    onClick={() => setProp('items', items.filter((_, j) => j !== i))}>×</button>}
            </span>;
        })}
        {editing && <button type="button" className="chip-add"
                            onClick={() => setProp('items', [...items, {text: 'New item'}])}>+ Add</button>}
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
    const to = !editing ? block.props.to : null;
    const caption = block.props.caption;
    return <div className="home-visual">
        <MediaPreview media={media} linkTo={to} onImageOpen={to ? undefined : onImageOpen}/>
        {editing
            ? <InlineText as="p" className="image-caption" value={caption || ''} placeholder="Caption (optional)"
                          onChange={v => setProp('caption', v)}/>
            : (caption ? <p className="image-caption">{caption}</p> : null)}
        {editing && <ImageUpload hasImage={!!url} clearLabel="Use featured" onUploaded={u => setProp('url', u)}
                                 onClear={() => setProp('url', '')}/>}
    </div>;
}

// An "Item": fill it in to create a new saved item, or load an existing one from
// the collection. Either way it syncs to the Works DB and shows in the dashboard.
function ItemBlock({block, setProp, editing, onImageOpen}) {
    const {title, description, price, image, to} = block.props;
    const media = image ? [{url: image, type: 'image/*'}] : [];
    const card = <article className="gallery-card work-card">
        <MediaPreview media={media} compact plain={!editing && !!to}
                      onImageOpen={(editing || to) ? undefined : onImageOpen}/>
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
    if (!editing && to) return <Link to={to} className="work-card-link">{card}</Link>;
    return card;
}

// Legacy: displays a portfolio item chosen from the Works DB (kept so old pages render).
function SavedWorkBlock({block, works, editing, onImageOpen}) {
    const list = works || [];
    const work = list.find(w => w.id === block.props.workId) || list[0];
    if (!work) return <p className="work-img-required">No saved items yet — add them in the dashboard Work tab.</p>;
    const to = block.props.to;
    const card = <WorkCard item={work} i={0} plain={!editing && !!to}
                           onImageOpen={(editing || to) ? undefined : onImageOpen}/>;
    if (!editing && to) return <Link to={to} className="work-card-link">{card}</Link>;
    return card;
}

function WidthCtl({block, setProp, columns}) {
    if (columns < 2) return null;
    const span = Math.min(block.props.span || 1, columns);
    return <label className="block-ctl">Width
        <select value={span} onChange={e => setProp('span', Number(e.target.value))}>
            {Array.from({length: columns}, (_, i) => i + 1).map(n =>
                <option key={n} value={n}>{n === columns ? `${n} · full` : n}</option>)}
        </select>
    </label>;
}

function LinkCtl({block, setProp, pages}) {
    const opts = pages || [];
    const known = opts.some(p => p.path === block.props.to);
    return <label className="block-ctl">Links to
        <select value={block.props.to || ''} onChange={e => setProp('to', e.target.value)}>
            <option value="">— none —</option>
            {!known && block.props.to && <option value={block.props.to}>{block.props.to}</option>}
            {opts.map(p => <option key={p.path} value={p.path}>{p.label}</option>)}
        </select>
    </label>;
}

function headingControls({block, setProp, columns, pages}) {
    return <>
        <label className="block-ctl">Size
            <select value={block.props.level || 2} onChange={e => setProp('level', Number(e.target.value))}>
                <option value={1}>H1</option>
                <option value={2}>H2</option>
                <option value={3}>H3</option>
            </select>
        </label>
        <LinkCtl block={block} setProp={setProp} pages={pages}/>
        <WidthCtl block={block} setProp={setProp} columns={columns}/>
    </>;
}

function widthControls({block, setProp, columns}) {
    return <WidthCtl block={block} setProp={setProp} columns={columns}/>;
}

function imageControls({block, setProp, columns, pages}) {
    return <>
        <LinkCtl block={block} setProp={setProp} pages={pages}/>
        <WidthCtl block={block} setProp={setProp} columns={columns}/>
    </>;
}

function buttonControls({block, setProp, pages}) {
    return <>
        <label className="block-ctl">Style
            <select value={block.props.variant || 'primary'} onChange={e => setProp('variant', e.target.value)}>
                <option value="primary">Primary</option>
                <option value="ghost">Ghost</option>
                <option value="link">Text link</option>
            </select>
        </label>
        <LinkCtl block={block} setProp={setProp} pages={pages}/>
    </>;
}

function itemControls({block, setProp, setProps, works, columns, pages}) {
    const list = works || [];

    function onLoad(e) {
        const id = e.target.value;
        if (!id) return;
        if (id === '__new__') {
            setProps({workId: '', title: 'New item', description: 'Describe this item.', price: '', image: ''});
            return;
        }
        const w = list.find(x => x.id === id);
        if (w) setProps({
            workId: w.id, title: w.title || '', description: w.description || '',
            price: w.price || '', image: w.media?.[0]?.url || ''
        });
    }

    return <>
        <label className="block-ctl">Load
            <select value="" onChange={onLoad}>
                <option value="">Load saved item…</option>
                <option value="__new__">— Blank new item —</option>
                {list.map(w => <option key={w.id} value={w.id}>{w.title || 'Untitled'}</option>)}
            </select>
        </label>
        <LinkCtl block={block} setProp={setProp} pages={pages}/>
        <WidthCtl block={block} setProp={setProp} columns={columns}/>
    </>;
}

function savedWorkControls({block, setProp, works, columns, pages}) {
    return <>
        <label className="block-ctl">Item
            <select value={block.props.workId || ''} onChange={e => setProp('workId', e.target.value)}>
                <option value="">— choose —</option>
                {(works || []).map(w => <option key={w.id} value={w.id}>{w.title || 'Untitled'}</option>)}
            </select>
        </label>
        <LinkCtl block={block} setProp={setProp} pages={pages}/>
        <WidthCtl block={block} setProp={setProp} columns={columns}/>
    </>;
}

// Each block type is self-contained: it carries its own content in `props`, so a
// page can hold any number of them. `legacy` types still render but aren't offered
// in the Add palette.
export const blockRegistry = {
    eyebrow: {label: 'Eyebrow', defaults: {text: 'Eyebrow', icon: 'Star'}, render: Eyebrow},
    heading: {label: 'Heading', defaults: {text: 'Heading', level: 2}, render: Heading, controls: headingControls},
    text: {label: 'Paragraph', defaults: {text: 'Paragraph text.'}, render: Text, controls: widthControls},
    button: {label: 'Button', defaults: {label: 'Button', to: '/contact', variant: 'primary'}, render: ButtonBlock, controls: buttonControls},
    list: {label: 'List', defaults: {items: ['Item one', 'Item two'], icon: 'BadgeCheck'}, render: ListBlock, controls: widthControls},
    image: {label: 'Image', defaults: {source: 'featured'}, render: ImageBlock, controls: imageControls},
    work: {
        label: 'Item',
        defaults: {title: 'New item', description: 'Describe this item.', price: '', image: ''},
        render: ItemBlock, controls: itemControls
    },
    savedwork: {label: 'Saved item', defaults: {}, render: SavedWorkBlock, controls: savedWorkControls, legacy: true},
};
