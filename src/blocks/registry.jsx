import React, {useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Check, CircleDot, Crop, Film, FolderOpen, Heading as HeadingIcon, Link2, List, RectangleHorizontal, Type, Upload, Video} from 'lucide-react';
import {isExternalUrl, Link, navigate} from '../lib/navigation.jsx';
import {MediaPreview} from '../components/MediaPreview.jsx';
import {ItemCard} from '../components/ItemCard.jsx';
import {ImageAdjust} from '../components/ImageAdjust.jsx';
import {htmlToText, InlineText, RichHtml, RichText, useEdit} from '../lib/edit.jsx';
import {EditableIcon} from '../components/IconPicker.jsx';
import {notify, promptDialog} from '../lib/dialog.jsx';
import {useProcessing} from '../lib/processing.jsx';
import {useUploads} from '../lib/uploads.jsx';
import {VideoPicker} from '../components/VideoPicker.jsx';
import {PagePicker} from '../components/PagePicker.jsx';

function Eyebrow({block, setProp, editing}) {
    const size = block.props.size;
    return <p className={`eyebrow${size ? ` txt-size-${size}` : ''}`}>
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
    const cls = block.props.size ? `txt-size-${block.props.size}` : undefined;
    if (editing) return <RichText as="p" className={cls} html={block.props.html} text={block.props.text} pages={pages}
                                  placeholder="Paragraph" onChange={h => setProp('html', h)}/>;
    return block.props.html != null
        ? <RichHtml as="p" className={cls} html={block.props.html}/>
        : <p className={cls}>{block.props.text}</p>;
}

function ButtonBlock({block, setProp, editing}) {
    const variant = block.props.variant || 'primary';
    const cls = variant === 'link' ? 'text-link' : `button button-${variant === 'ghost' ? 'ghost' : 'primary'}`;
    const iconEl = <EditableIcon className="ui-icon" name={block.props.icon} fallback="ArrowRight" size={18}
                                 editing={editing} allowNone onChange={v => setProp('icon', v)}/>;
    if (!editing) return block.props.to
        ? <Link to={block.props.to} className={cls}>{block.props.label}{iconEl}</Link>
        : <span className={cls}>{block.props.label}{iconEl}</span>;
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
            const content = <>{bulletEl}{textEl}</>;
            return <li key={i} className={`list-item${it.to ? ' list-item-linked' : ''}`}>
                {(!editing && it.to)
                    ? <Link to={it.to} className="list-item-inner">{content}</Link>
                    : <span className="list-item-inner">{content}</span>}
                {editing && <span className="list-item-edit">
                    <ItemLinkCtl to={it.to} pages={pages} onChange={v => update(i, {to: v})}/>
                    <button type="button" className="chip-remove" data-tip="Remove item" aria-label="Remove item"
                            onClick={() => setProp('items', items.filter((_, j) => j !== i))}>×</button>
                </span>}
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

    return <>
        <label className="button button-ghost img-act-btn">
            <Upload size={15}/>{busy ? 'Uploading…' : (hasImage ? 'Replace' : 'Upload')}
            <input type="file" accept="image/*,.heic,.heif" onChange={onChange}/></label>
        {hasImage && onClear && clearLabel &&
            <button type="button" className="button button-ghost img-act-btn" onClick={onClear}>{clearLabel}</button>}
    </>;
}

// Measure the *actual* rendered frame so the adjuster previews at its real shape. A
// block stretched across many columns is far wider than its base aspect ratio (and
// frames with a max-height go wide-and-short), so a fixed guess won't match.
function frameAspect(rootRef, fallback) {
    const fr = rootRef.current?.querySelector('.media-frame');
    if (fr) {
        const r = fr.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return r.width / r.height;
    }
    return fallback;
}

function ImageBlock({block, setProp, editing, featured, onImageOpen}) {
    const [adjust, setAdjust] = useState(false);
    const [aspect, setAspect] = useState(0.72);
    const rootRef = useRef(null);
    const url = block.props.url;
    const placement = block.props.placement;
    const src = url || featured?.media?.[0]?.url || '';
    const media = src ? [{url: src, type: 'image/*', placement}] : [];
    const to = !editing ? block.props.to : null;
    const caption = block.props.caption;
    // In edit mode, clicking the image opens the crop adjuster instead of the lightbox.
    const openAdjust = () => {
        setAspect(frameAspect(rootRef, 0.72));
        setAdjust(true);
    };
    const onImg = editing ? (src ? openAdjust : undefined) : (to ? undefined : onImageOpen);
    return <div className="home-visual" ref={rootRef}>
        <MediaPreview media={media} linkTo={to} onImageOpen={onImg}/>
        {editing
            ? <InlineText as="p" className="image-caption" value={caption || ''} placeholder="Caption (optional)"
                          onChange={v => setProp('caption', v)}/>
            : (caption ? <p className="image-caption">{caption}</p> : null)}
        {editing && <div className="img-actions">
            <ImageUpload hasImage={!!url} onUploaded={u => setProp('url', u)}/>
            {src && <button type="button" className="button button-ghost img-act-btn adjust-trigger"
                            onClick={openAdjust}><Crop size={15}/>Adjust</button>}
        </div>}
        {adjust && src && <ImageAdjust src={src} value={placement} aspect={aspect} onApply={p => setProp('placement', p)}
                                       onClose={() => setAdjust(false)}/>}
    </div>;
}

// Upload control for the Video block. The actual upload is handed to the global upload manager
// so it keeps running (and showing progress in the corner dock) even if you navigate away or
// the block unmounts. When it finishes we set the block's video and refresh the badge state.
function VideoUpload({hasVideo, blockId, onUploaded}) {
    const {refresh} = useProcessing();
    const {start} = useUploads();

    function onChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        start(file, {
            blockId,
            onComplete: res => {
                if (res?.url) {
                    onUploaded(res.url);
                    refresh();
                } else {
                    notify(res?.error || 'Upload failed.', 'error');
                }
            }
        });
    }

    return <label className="button button-ghost img-act-btn">
        <Upload size={15}/>{hasVideo ? 'Replace video' : 'Upload video'}
        <input type="file" accept="video/*" onChange={onChange}/>
    </label>;
}

// A Video block: upload a new video, or pick an already-uploaded one from the library.
function VideoBlock({block, setProp, editing, route}) {
    const [picking, setPicking] = useState(false);
    const {uploads} = useUploads();
    const {reload} = useEdit();
    // Set the block's video AND persist it to the saved layout, then refresh settings so the
    // block shows the video without a manual reload (it survives navigation/reload either way).
    const setVideo = u => {
        setProp('url', u);
        if (route && block.id && u) {
            fetch('/api/admin/block-media', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({route, blockId: block.id, url: u})
            }).then(r => {
                if (r.ok) reload?.(); // pull the freshly-linked URL into the rendered (non-edit) view
            }).catch(() => {});
        }
    };
    // This block's in-flight upload (if any) — drives the inline status.
    const upload = uploads.findLast?.(u => u.blockId === block.id)
        ?? [...uploads].reverse().find(u => u.blockId === block.id);
    const uploading = upload?.status === 'uploading' || upload?.status === 'error';
    const finishing = upload?.status === 'done'; // transfer done; URL is being linked/loaded
    const url = block.props.url;
    const caption = block.props.caption;
    const media = url ? [{url, type: 'video/mp4'}] : [];
    const pct = Math.round((upload?.progress || 0) * 100);
    return <div className="home-visual">
        {uploading
            ? <div className={`media-frame video-uploading${upload.status === 'error' ? ' is-error' : ''}`}>
                <Video size={34}/>
                <span className="video-uploading-label">
                    {upload.status === 'error' ? (upload.error || 'Upload failed') : `Uploading ${pct}%`}
                </span>
                {upload.status === 'uploading' &&
                    <div className="upload-bar"><div className="upload-bar-fill" style={{width: `${pct}%`}}/></div>}
            </div>
            : url
                ? <MediaPreview media={media}/>
                : finishing
                    ? <div className="media-frame video-uploading">
                        <Video size={34}/><span className="video-uploading-label">Finishing up…</span>
                    </div>
                    : editing
                        ? <div className="media-frame video-empty"><Video size={38}/><span>No video uploaded yet</span></div>
                        : null}
        {editing
            ? <InlineText as="p" className="image-caption" value={caption || ''} placeholder="Caption (optional)"
                          onChange={v => setProp('caption', v)}/>
            : (caption ? <p className="image-caption">{caption}</p> : null)}
        {editing && <div className="img-actions">
            <VideoUpload hasVideo={!!url} blockId={block.id} onUploaded={setVideo}/>
            <button type="button" className="button button-ghost img-act-btn" onClick={() => setPicking(true)}>
                <Film size={15}/>Library
            </button>
        </div>}
        {picking && <VideoPicker current={url}
                                 onPick={u => {
                                     setProp('url', u); // a deliberate pick stays in the draft until you save
                                     setPicking(false);
                                 }}
                                 onClose={() => setPicking(false)}/>}
    </div>;
}

// An "Item": fill it in to create a new saved item, or load an existing one from
// the collection. Either way it syncs to the Items DB and shows in the dashboard.
function ItemBlock({block, setProp, editing, onImageOpen}) {
    const [adjust, setAdjust] = useState(false);
    const [aspect, setAspect] = useState(0.86);
    const rootRef = useRef(null);
    const {title, description, price, image, to, placement} = block.props;
    const media = image ? [{url: image, type: 'image/*', placement}] : [];
    const openAdjust = () => {
        setAspect(frameAspect(rootRef, 0.86));
        setAdjust(true);
    };
    const onImg = editing ? (image ? openAdjust : undefined) : onImageOpen;
    const card = <article className="gallery-card item-card" ref={rootRef}>
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
        {editing && <div className="img-actions">
            <ImageUpload hasImage={!!image} onUploaded={u => setProp('image', u)}/>
            {image && <button type="button" className="button button-ghost img-act-btn adjust-trigger"
                              onClick={openAdjust}><Crop size={15}/>Adjust</button>}
        </div>}
        {editing && !image && <p className="item-img-required">A picture is required before saving.</p>}
    </article>;
    return <>
        {(!editing && to) ? <div className="item-card-clickable" onClick={() => navigate(to)}>{card}</div> : card}
        {adjust && image && <ImageAdjust src={image} value={placement} aspect={aspect}
                                         onApply={p => setProp('placement', p)}
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

// A compact block-bar control: an icon button (with optional value badge) that opens a
// small popover of choices. Replaces cramped <select> dropdowns so the bar stays on one
// tidy line even in narrow multi-column blocks; the current choice shows in the tooltip.
function CtlMenu({icon, title, value, options, onChange, badge}) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState(null);
    const ref = useRef(null);
    const current = options.find(o => String(o.value) === String(value));
    const tip = `${title}: ${current?.label ?? '—'}`;

    function toggle() {
        if (open) return setOpen(false);
        const r = ref.current.getBoundingClientRect();
        setPos({top: r.bottom + 6, left: r.left});
        setOpen(true);
    }

    return <>
        <button ref={ref} type="button"
                className={`block-ctl-btn${open ? ' is-open' : ''}${badge != null ? ' has-badge' : ''}`}
                data-tip={tip} aria-label={tip} onClick={toggle}>
            {icon}{badge != null && <span className="ctl-badge">{badge}</span>}
        </button>
        {open && createPortal(
            <div className="ctl-menu-backdrop" onMouseDown={() => setOpen(false)}>
                <div className="ctl-menu-pop" style={pos || undefined} onMouseDown={e => e.stopPropagation()}>
                    <div className="ctl-menu-head">{title}</div>
                    {options.map(o => <button key={String(o.value)} type="button"
                            className={`ctl-menu-item${String(o.value) === String(value) ? ' active' : ''}`}
                            onClick={() => {
                                onChange(o.value);
                                setOpen(false);
                            }}>
                        <span>{o.label}</span>
                        {String(o.value) === String(value) && <Check size={14}/>}
                    </button>)}
                </div>
            </div>, document.body)}
    </>;
}

// Block-level link control: one link icon — grey when nothing is linked, green when it
// points somewhere. Opens the searchable page picker (which is also where a link is
// removed). The tooltip reads "Link to Page" / "Linked to <page>".
function LinkCtl({block, setProp, pages}) {
    const opts = pages || [];
    const to = block.props.to || '';
    const external = isExternalUrl(to);
    const page = opts.find(p => p.path === to);
    const [picker, setPicker] = useState(false);
    const target = external ? to : (page ? page.label : to);
    const tip = to ? `Linked to ${target}` : 'Link to Page';

    async function setExternal() {
        const url = await promptDialog('External link (opens in a new tab):', external ? to : 'https://');
        if (url && url.trim()) setProp('to', url.trim());
    }

    return <>
        <button type="button" className={`block-ctl-btn link-btn${to ? ' is-linked' : ''}`}
                data-tip={tip} aria-label={tip} onClick={() => setPicker(true)}><Link2 size={15}/></button>
        {picker && <PagePicker pages={opts} current={external ? '' : to} title="Link block to a page"
                               onPick={path => {
                                   setProp('to', path);
                                   setPicker(false);
                               }}
                               onExternal={() => {
                                   setPicker(false);
                                   setExternal();
                               }}
                               onRemove={to ? () => {
                                   setProp('to', '');
                                   setPicker(false);
                               } : undefined}
                               onClose={() => setPicker(false)}/>}
    </>;
}

// Compact per-list-item link picker shown inline in edit mode — an icon that goes green
// when the row links somewhere. Links the whole row.
function ItemLinkCtl({to = '', pages, onChange}) {
    const opts = pages || [];
    const external = isExternalUrl(to);
    const page = opts.find(p => p.path === to);
    const [picker, setPicker] = useState(false);
    const target = external ? to : (page ? page.label : to);
    const tip = to ? `Linked to ${target}` : 'Link to Page';

    async function setExternal() {
        const url = await promptDialog('External link (opens in a new tab):', external ? to : 'https://');
        if (url && url.trim()) onChange(url.trim());
    }

    return <>
        <button type="button" className={`list-item-link${to ? ' is-set' : ''}`} data-tip={tip} aria-label={tip}
                onClick={() => setPicker(true)}><Link2 size={14}/></button>
        {picker && <PagePicker pages={opts} current={external ? '' : to} title="Link item to a page"
                               onPick={path => {
                                   onChange(path);
                                   setPicker(false);
                               }}
                               onExternal={() => {
                                   setPicker(false);
                                   setExternal();
                               }}
                               onRemove={to ? () => {
                                   onChange('');
                                   setPicker(false);
                               } : undefined}
                               onClose={() => setPicker(false)}/>}
    </>;
}

// Wide, absolute text-size scale shared by the eyebrow and paragraph blocks. '' = the
// block's natural size (so existing content is untouched).
const TEXT_SIZES = [
    {value: '', label: 'Default'},
    {value: 'xs', label: 'Extra small'},
    {value: 'sm', label: 'Small'},
    {value: 'md', label: 'Medium'},
    {value: 'lg', label: 'Large'},
    {value: 'xl', label: 'Extra large'},
    {value: '2xl', label: 'Huge'},
    {value: '3xl', label: 'Display'},
    {value: '4xl', label: 'Jumbo'},
    {value: '5xl', label: 'Giant'},
];
const TEXT_SIZE_BADGE = {
    '': 'A', xs: 'XS', sm: 'S', md: 'M', lg: 'L', xl: 'XL', '2xl': '2X', '3xl': '3X', '4xl': '4X', '5xl': '5X'
};

function textSizeControls({block, setProp}) {
    const size = block.props.size || '';
    return <CtlMenu icon={<Type size={15}/>} title="Text size" value={size}
                    badge={TEXT_SIZE_BADGE[size] || 'A'} options={TEXT_SIZES}
                    onChange={v => setProp('size', v)}/>;
}

function headingControls({block, setProp, pages}) {
    const lvl = block.props.level || 2;
    return <>
        <CtlMenu icon={<HeadingIcon size={15}/>} title="Heading size" value={String(lvl)}
                 badge={lvl === 'p' ? 'P' : `H${lvl}`}
                 options={[
                     {value: '1', label: 'Heading 1'},
                     {value: '2', label: 'Heading 2'},
                     {value: '3', label: 'Heading 3'},
                     {value: '4', label: 'Heading 4'},
                     {value: '5', label: 'Heading 5'},
                     {value: '6', label: 'Heading 6'},
                     {value: 'p', label: 'Paragraph'},
                 ]}
                 onChange={v => setProp('level', v === 'p' ? 'p' : Number(v))}/>
        <LinkCtl block={block} setProp={setProp} pages={pages}/>
    </>;
}

function listControls({block, setProp}) {
    return <>
        <CtlMenu icon={<List size={15}/>} title="List style" value={block.props.variant || 'chips'}
                 options={[{value: 'chips', label: 'Chips'}, {value: 'plain', label: 'Text only'}]}
                 onChange={v => setProp('variant', v)}/>
        <CtlMenu icon={<CircleDot size={15}/>} title="Bullets" value={block.props.bullet || 'icon'}
                 options={[{value: 'icon', label: 'Icons'}, {value: 'disc', label: 'Circle'},
                     {value: 'square', label: 'Square'}, {value: 'none', label: 'None'}]}
                 onChange={v => setProp('bullet', v)}/>
        <CtlMenu icon={<Type size={15}/>} title="Text size" value={block.props.size || 'md'}
                 badge={({sm: 'S', md: 'M', lg: 'L'})[block.props.size || 'md']}
                 options={[{value: 'sm', label: 'Small'}, {value: 'md', label: 'Medium'}, {value: 'lg', label: 'Large'}]}
                 onChange={v => setProp('size', v)}/>
    </>;
}

function imageControls({block, setProp, pages}) {
    return <LinkCtl block={block} setProp={setProp} pages={pages}/>;
}

function buttonControls({block, setProp, pages}) {
    return <>
        <CtlMenu icon={<RectangleHorizontal size={15}/>} title="Button style" value={block.props.variant || 'primary'}
                 options={[{value: 'primary', label: 'Primary'}, {value: 'ghost', label: 'Ghost'},
                     {value: 'link', label: 'Text link'}]}
                 onChange={v => setProp('variant', v)}/>
        <LinkCtl block={block} setProp={setProp} pages={pages}/>
    </>;
}

function itemControls({block, setProp, setProps, items, pages}) {
    const list = items || [];

    function load(id) {
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
        <CtlMenu icon={<FolderOpen size={15}/>} title="Load item" value=""
                 options={[{value: '__new__', label: 'Blank new item'},
                     ...list.map(w => ({value: w.id, label: w.title || 'Untitled'}))]}
                 onChange={load}/>
        <LinkCtl block={block} setProp={setProp} pages={pages}/>
    </>;
}

function savedItemControls({block, setProp, items, pages}) {
    return <>
        <CtlMenu icon={<FolderOpen size={15}/>} title="Saved item" value={block.props.itemId || ''}
                 options={[{value: '', label: '— choose —'},
                     ...(items || []).map(w => ({value: w.id, label: w.title || 'Untitled'}))]}
                 onChange={v => setProp('itemId', v)}/>
        <LinkCtl block={block} setProp={setProp} pages={pages}/>
    </>;
}

// Each block type is self-contained: it carries its own content in `props`, so a
// page can hold any number of them. `legacy` types still render but aren't offered
// in the Add palette.
export const blockRegistry = {
    spacer: {label: 'Spacer', defaults: {text: 'Spacer'}},
    divider: {label: 'Divider', defaults: {}, render: Divider},
    eyebrow: {label: 'Eyebrow', defaults: {text: 'Eyebrow', icon: 'Star'}, render: Eyebrow, controls: textSizeControls},
    heading: {label: 'Heading', defaults: {text: 'Heading', level: 2}, render: Heading, controls: headingControls},
    text: {label: 'Paragraph', defaults: {text: 'Paragraph text.'}, render: Text, controls: textSizeControls},
    button: {label: 'Button', defaults: {label: 'Button', to: '/contact', variant: 'primary'}, render: ButtonBlock, controls: buttonControls},
    list: {label: 'List', defaults: {items: ['Item one', 'Item two'], icon: 'BadgeCheck', variant: 'chips', size: 'md'}, render: ListBlock, controls: listControls},
    image: {label: 'Image', defaults: {source: 'featured'}, render: ImageBlock, controls: imageControls},
    video: {label: 'Video', defaults: {}, render: VideoBlock},
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
