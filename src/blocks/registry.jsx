import React, {useState} from 'react';
import {Link2} from 'lucide-react';
import {isExternalUrl, Link, navigate} from '../lib/navigation.jsx';
import {MediaPreview} from '../components/MediaPreview.jsx';
import {ItemCard} from '../components/ItemCard.jsx';
import {ImageAdjust} from '../components/ImageAdjust.jsx';
import {htmlToText, InlineText, RichHtml, RichText} from '../lib/edit.jsx';
import {EditableIcon} from '../components/IconPicker.jsx';
import {notify, promptDialog} from '../lib/dialog.jsx';
import {PagePicker} from '../components/PagePicker.jsx';

function Eyebrow({block, setProp, editing}) {
    return <p className="eyebrow">
        <EditableIcon className="ui-icon" name={block.props.icon} fallback="Star" size={15} editing={editing}
                      onChange={v => setProp('icon', v)}/>{' '}
        {editing
            ? <InlineText value={block.props.text} placeholder="Eyebrow" onChange={v => setProp('text', v)}/>
            : block.props.text}
    </p>;
}

function Divider() {return <hr className="divider" />;}

// `level` is 1–6 for h1–h6, or 'p' to render as a paragraph.
function Heading({block, setProp, editing, pages}) {
    const lvl = block.props.level || 2;
    const Tag = lvl === 'p' ? 'p' : `h${lvl}`;
    if (editing) return <RichText as={Tag} html={block.props.html} text={block.props.text} pages={pages}
                                  placeholder="Heading" onChange={h => setProp('html', h)}/>;
    const el = block.props.html != null
        ? <RichHtml as={Tag} html={block.props.html}/>
        : <Tag>{block.props.text}</Tag>;
    return block.props.to ? <Link to={block.props.to} className="block-link">{el}</Link> : el;
}

function Text({block, setProp, editing, pages}) {
    if (editing) return <RichText as="p" html={block.props.html} text={block.props.text} pages={pages}
                                  placeholder="Paragraph" onChange={h => setProp('html', h)}/>;
    return block.props.html != null
        ? <RichHtml as="p" html={block.props.html}/>
        : <p>{block.props.text}</p>;
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

// List items may be strings (legacy) or {text, html, icon}. Each item's icon is
// click-to-edit and its text supports inline links (pages + external) like paragraphs.
// Renders as a vertical stack in both view and edit modes so they match. `variant`
// is 'chips' (pill) or 'plain' (text only); `size` is sm/md/lg.
function ListBlock({block, setProp, editing, pages}) {
    const items = block.props.items || [];
    const bullet = block.props.icon || 'BadgeCheck';
    const variant = block.props.variant || 'chips';
    const size = block.props.size || 'md';
    const bulletStyle = block.props.bullet || 'icon'; // 'icon' | 'disc' | 'square' | 'none'
    const norm = raw => (typeof raw === 'string' ? {text: raw} : (raw || {}));
    const update = (i, patch) => setProp('items', items.map((x, j) => j === i ? {...norm(x), ...patch} : x));
    return <ul className={`list-block list-${variant} list-${size}`}>
        {items.map((raw, i) => {
            const it = norm(raw);
            const bulletEl = bulletStyle === 'icon'
                ? <EditableIcon className="ui-icon" name={it.icon} fallback={bullet} size={16} editing={editing}
                                onChange={v => update(i, {icon: v})}/>
                : bulletStyle === 'none' ? null
                    : <span className={`list-bullet list-bullet-${bulletStyle}`} aria-hidden="true"/>;
            // When the whole item is linked, show plain text (no inline rich links) to
            // avoid an <a> inside an <a>.
            const textEl = editing
                ? <RichText className="list-item-text" html={it.html} text={it.text} pages={pages}
                            placeholder="Item" onChange={h => update(i, {html: h})}/>
                : (it.to
                    ? <span className="list-item-text">{it.html != null ? htmlToText(it.html) : it.text}</span>
                    : (it.html != null
                        ? <RichHtml className="list-item-text" html={it.html}/>
                        : <span className="list-item-text">{it.text}</span>));
            const inner = <>{bulletEl}{textEl}</>;
            return <li key={i} className={`list-item${it.to ? ' list-item-linked' : ''}`}>
                {(!editing && it.to)
                    ? <Link to={it.to} className="list-item-inner">{inner}</Link>
                    : inner}
                {editing && <ItemLinkCtl to={it.to} pages={pages} onChange={v => update(i, {to: v})}/>}
                {editing && <button type="button" className="chip-remove" title="Remove"
                                    onClick={() => setProp('items', items.filter((_, j) => j !== i))}>×</button>}
            </li>;
        })}
        {editing && <li className="list-add-row">
            <button type="button" className="chip-add"
                    onClick={() => setProp('items', [...items, {text: 'New item'}])}>+ Add item</button>
        </li>}
    </ul>;
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
            else notify(j.error || 'Upload failed.', 'error');
        } catch {
            notify('Network error. Upload failed.', 'error');
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
    const [adjust, setAdjust] = useState(false);
    const url = block.props.url;
    const placement = block.props.placement;
    const src = url || featured?.media?.[0]?.url || '';
    const media = src ? [{url: src, type: 'image/*', placement}] : [];
    const to = !editing ? block.props.to : null;
    const caption = block.props.caption;
    // In edit mode, clicking the image opens the crop adjuster instead of the lightbox.
    const onImg = editing ? (src ? () => setAdjust(true) : undefined) : (to ? undefined : onImageOpen);
    return <div className="home-visual">
        <MediaPreview media={media} linkTo={to} onImageOpen={onImg}/>
        {editing
            ? <InlineText as="p" className="image-caption" value={caption || ''} placeholder="Caption (optional)"
                          onChange={v => setProp('caption', v)}/>
            : (caption ? <p className="image-caption">{caption}</p> : null)}
        {editing && <ImageUpload hasImage={!!url} clearLabel="Use item image" onUploaded={u => setProp('url', u)}
                                 onClear={() => setProp('url', '')}/>}
        {editing && src && <button type="button" className="button button-ghost adjust-trigger"
                                   onClick={() => setAdjust(true)}>Adjust image</button>}
        {adjust && src && <ImageAdjust src={src} value={placement} onApply={p => setProp('placement', p)}
                                       onClose={() => setAdjust(false)}/>}
    </div>;
}

// An "Item": fill it in to create a new saved item, or load an existing one from
// the collection. Either way it syncs to the Items DB and shows in the dashboard.
function ItemBlock({block, setProp, editing, onImageOpen}) {
    const [adjust, setAdjust] = useState(false);
    const {title, description, price, image, to, placement} = block.props;
    const media = image ? [{url: image, type: 'image/*', placement}] : [];
    const onImg = editing ? (image ? () => setAdjust(true) : undefined) : onImageOpen;
    const card = <article className="gallery-card item-card">
        <MediaPreview media={media} compact onImageOpen={onImg}/>
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
        {editing && image && <button type="button" className="button button-ghost adjust-trigger"
                                     onClick={() => setAdjust(true)}>Adjust image</button>}
        {editing && !image && <p className="item-img-required">A picture is required before saving.</p>}
    </article>;
    return <>
        {(!editing && to) ? <div className="item-card-clickable" onClick={() => navigate(to)}>{card}</div> : card}
        {adjust && image && <ImageAdjust src={image} value={placement} onApply={p => setProp('placement', p)}
                                         onClose={() => setAdjust(false)}/>}
    </>;
}

// Footer copyright line. The year is always the current year (computed at render),
// so it never goes stale. The editable text is whatever follows the year.
function CopyrightBlock({block, setProp, editing}) {
    const year = new Date().getFullYear();
    return <p className="copyright">© {year}{' '}
        {editing
            ? <InlineText value={block.props.text} placeholder="Company · All rights reserved."
                          onChange={v => setProp('text', v)}/>
            : block.props.text}
    </p>;
}

// Legacy: displays a saved item chosen from the Items DB (kept so old pages render).
function SavedItemBlock({block, items, editing, onImageOpen}) {
    const list = items || [];
    const item = list.find(w => w.id === block.props.itemId) || list[0];
    if (!item) return <p className="item-img-required">No saved items yet — add them in the dashboard Item tab.</p>;
    const to = block.props.to;
    const card = <ItemCard item={item} i={0} onImageOpen={editing ? undefined : onImageOpen}/>;
    if (!editing && to) return <div className="item-card-clickable" onClick={() => navigate(to)}>{card}</div>;
    return card;
}

function LinkCtl({block, setProp, pages}) {
    const opts = pages || [];
    const to = block.props.to || '';
    const external = isExternalUrl(to);
    const known = opts.some(p => p.path === to);
    const [picker, setPicker] = useState(false);
    const page = opts.find(p => p.path === to);

    async function setExternal() {
        const url = await promptDialog('External link (opens in a new tab):', external ? to : 'https://');
        if (url && url.trim()) setProp('to', url.trim());
    }

    const label = external ? `External: ${to}` : page ? page.label : known ? to : to || 'None';

    return <div className="block-ctl link-ctl">
        <span>Links to</span>
        <button type="button" className={`link-picker-trigger${to ? ' is-set' : ''}`}
                title={to || 'No link'} onClick={() => setPicker(true)}>{label}</button>
        {to && <button type="button" className="link-clear" title="Remove link" onClick={() => setProp('to', '')}>×</button>}
        {picker && <PagePicker pages={opts} current={external ? '' : to} title="Link block to a page"
                               onPick={path => {
                                   setProp('to', path);
                                   setPicker(false);
                               }}
                               onExternal={() => {
                                   setPicker(false);
                                   setExternal();
                               }}
                               onClose={() => setPicker(false)}/>}
    </div>;
}

// Compact per-list-item link picker shown inline in edit mode. Links the whole row.
function ItemLinkCtl({to = '', pages, onChange}) {
    const opts = pages || [];
    const external = isExternalUrl(to);
    const page = opts.find(p => p.path === to);
    const [picker, setPicker] = useState(false);

    async function setExternal() {
        const url = await promptDialog('External link (opens in a new tab):', external ? to : 'https://');
        if (url && url.trim()) onChange(url.trim());
    }

    const label = external ? 'External' : page ? page.label : to || 'No link';

    return <>
        <button type="button" className={`list-item-link${to ? ' is-set' : ''}`} title={to || 'Link this whole item'}
                onClick={() => setPicker(true)}><Link2 size={13}/> {label}</button>
        {picker && <PagePicker pages={opts} current={external ? '' : to} title="Link item to a page"
                               onPick={path => {
                                   onChange(path);
                                   setPicker(false);
                               }}
                               onExternal={() => {
                                   setPicker(false);
                                   setExternal();
                               }}
                               onClose={() => setPicker(false)}/>}
    </>;
}

function headingControls({block, setProp, columns, pages}) {
    return <>
        <label className="block-ctl">Size
            <select value={String(block.props.level || 2)}
                    onChange={e => setProp('level', e.target.value === 'p' ? 'p' : Number(e.target.value))}>
                <option value="1">H1</option>
                <option value="2">H2</option>
                <option value="3">H3</option>
                <option value="4">H4</option>
                <option value="5">H5</option>
                <option value="6">H6</option>
                <option value="p">Paragraph</option>
            </select>
        </label>
        <LinkCtl block={block} setProp={setProp} pages={pages}/>    </>;
}

function listControls({block, setProp, columns}) {
    return <>
        <label className="block-ctl">Style
            <select value={block.props.variant || 'chips'} onChange={e => setProp('variant', e.target.value)}>
                <option value="chips">Chips</option>
                <option value="plain">Text only</option>
            </select>
        </label>
        <label className="block-ctl">Bullets
            <select value={block.props.bullet || 'icon'} onChange={e => setProp('bullet', e.target.value)}>
                <option value="icon">Icons</option>
                <option value="disc">Circle</option>
                <option value="square">Square</option>
                <option value="none">None</option>
            </select>
        </label>
        <label className="block-ctl">Size
            <select value={block.props.size || 'md'} onChange={e => setProp('size', e.target.value)}>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
            </select>
        </label>    </>;
}

function imageControls({block, setProp, columns, pages}) {
    return <>
        <LinkCtl block={block} setProp={setProp} pages={pages}/>    </>;
}

function buttonControls({block, setProp, pages, columns}) {
    return <>
        <label className="block-ctl">Style
            <select value={block.props.variant || 'primary'} onChange={e => setProp('variant', e.target.value)}>
                <option value="primary">Primary</option>
                <option value="ghost">Ghost</option>
                <option value="link">Text link</option>
            </select>
        </label>
        <LinkCtl block={block} setProp={setProp} pages={pages}/>    </>;
}

function itemControls({block, setProp, setProps, items, columns, pages}) {
    const list = items || [];

    function onLoad(e) {
        const id = e.target.value;
        if (!id) return;
        if (id === '__new__') {
            setProps({itemId: '', title: 'New item', description: 'Describe this item.', price: '', image: ''});
            return;
        }
        const w = list.find(x => x.id === id);
        if (w) setProps({
            itemId: w.id, title: w.title || '', description: w.description || '',
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
        <LinkCtl block={block} setProp={setProp} pages={pages}/>    </>;
}

function savedItemControls({block, setProp, items, columns, pages}) {
    return <>
        <label className="block-ctl">Item
            <select value={block.props.itemId || ''} onChange={e => setProp('itemId', e.target.value)}>
                <option value="">— choose —</option>
                {(items || []).map(w => <option key={w.id} value={w.id}>{w.title || 'Untitled'}</option>)}
            </select>
        </label>
        <LinkCtl block={block} setProp={setProp} pages={pages}/>    </>;
}

// Each block type is self-contained: it carries its own content in `props`, so a
// page can hold any number of them. `legacy` types still render but aren't offered
// in the Add palette.
export const blockRegistry = {
    spacer: {label: 'Spacer', defaults: {text: 'Spacer'}},
    divider: {label: 'Divider', defaults: {}, render: Divider},
    eyebrow: {label: 'Eyebrow', defaults: {text: 'Eyebrow', icon: 'Star'}, render: Eyebrow},
    heading: {label: 'Heading', defaults: {text: 'Heading', level: 2}, render: Heading, controls: headingControls},
    text: {label: 'Paragraph', defaults: {text: 'Paragraph text.'}, render: Text},
    button: {label: 'Button', defaults: {label: 'Button', to: '/contact', variant: 'primary'}, render: ButtonBlock, controls: buttonControls},
    list: {label: 'List', defaults: {items: ['Item one', 'Item two'], icon: 'BadgeCheck', variant: 'chips', size: 'md'}, render: ListBlock, controls: listControls},
    image: {label: 'Image', defaults: {source: 'featured'}, render: ImageBlock, controls: imageControls},
    item: {
        label: 'Item',
        defaults: {title: 'New item', description: 'Describe this item.', price: '', image: ''},
        render: ItemBlock, controls: itemControls
    },
    // Legacy alias: pages saved before the rename still use type 'work'.
    work: {
        label: 'Item',
        defaults: {title: 'New item', description: 'Describe this item.', price: '', image: ''},
        render: ItemBlock, controls: itemControls, legacy: true
    },
    savedwork: {label: 'Saved item', defaults: {}, render: SavedItemBlock, controls: savedItemControls, legacy: true},
    copyright: {
        label: 'Copyright',
        defaults: {text: 'All rights reserved.'},
        render: CopyrightBlock
    },
};
