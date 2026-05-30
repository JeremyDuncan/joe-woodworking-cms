import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import Cropper from 'react-easy-crop';
import {
    ArrowRight,
    BadgeCheck,
    Edit3,
    Flag,
    ImagePlus,
    Lock,
    LogOut,
    Mail,
    Medal,
    Menu,
    Plus,
    Save,
    Shield,
    Sparkles,
    Star,
    Trash2,
    Video,
    X
} from 'lucide-react';
import './styles.css';

const fallbackGallery = [
    {
        title: 'Classic Heritage',
        description: 'Clean stars, bold stripes, hand-painted finish',
        price: 'Custom quote',
        media: []
    },
    {
        title: 'State Silhouette Flags',
        description: 'American flag artwork shaped into a meaningful state outline',
        price: 'Custom quote',
        media: [{url: '/joe-business-card.jpg', type: 'image/jpeg'}]
    },
    {
        title: 'Service Tribute',
        description: 'Army, Navy, Air Force, Marines, Coast Guard & Space Force',
        price: 'Custom quote',
        media: []
    }
];

const defaultSettings = {
    brandName: 'Joe’s Custom Flags', brandShort: 'Joe’s Flags', email: 'Smokingjoe38@yahoo.com', phone: '706.299.8309',
    nav: [{label: 'Home', path: '/'}, {label: 'Work', path: '/work'}, {
        label: 'Options',
        path: '/options'
    }, {label: 'Process', path: '/process'}, {label: 'Contact', path: '/contact'}],
    hero: {
        eyebrow: 'Joe’s Custom Hand Crafted Flags',
        title: 'Hand-crafted American flags built to become family heirlooms.',
        body: 'Custom solid-wood American flag decor by Joe — hand-built, hand-painted, and personalized with logos, service branches, teams, memorials, patriotic themes, or your own image.',
        primaryCta: 'Request a custom flag',
        secondaryCta: 'View recent work'
    },
    proof: ['48 inches tall', 'Solid 2x12 wood', 'Hand-painted finish', 'State-shaped flags available'],
    work: {
        eyebrow: 'Recent work gallery',
        title: 'Built for homes, shops, offices, veteran gifts, and patriotic celebrations.',
        body: 'Browse recent custom pieces and examples. Photos and videos are managed by the private CMS.'
    },
    options: {
        eyebrow: 'Your flag, your story',
        title: 'Choose from ready-made concepts or send your own idea.',
        body: 'Every flag includes a lower custom design area for artwork that makes the piece personal.',
        items: ['Business logos', 'College & professional teams', 'All military branches', '250 years of freedom themes', 'Memorial & service tributes', 'Your supplied custom artwork']
    },
    process: {
        eyebrow: 'Simple ordering process',
        title: 'From message to finished piece.',
        steps: [{
            title: 'Share your idea',
            body: 'Send a theme, logo, team, branch, memorial concept, or reference image.'
        }, {
            title: 'Approve the direction',
            body: 'Pick from available design options or refine a custom layout for the lower panel.'
        }, {
            title: 'Hand-built with pride',
            body: 'Your solid wood flag is crafted, painted, finished, and prepared for pickup or delivery details.'
        }]
    },
    contact: {
        eyebrow: 'Ready to start?',
        title: 'Message with questions or to commission a custom American flag.',
        body: 'Tell us the design you have in mind, who the flag is for, and whether you have artwork or a logo to include.'
    }
};

function mergeSettings(s) {
    return {
        ...defaultSettings, ...(s || {}),
        hero: {...defaultSettings.hero, ...(s?.hero || {})},
        work: {...defaultSettings.work, ...(s?.work || {})},
        options: {...defaultSettings.options, ...(s?.options || {})},
        process: {...defaultSettings.process, ...(s?.process || {})},
        contact: {...defaultSettings.contact, ...(s?.contact || {})}
    };
}

function navigate(path) {
    history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
    scrollTo({top: 0, behavior: 'smooth'});
}

function Link({to, children, className}) {
    return <a href={to} className={className} onClick={e => {
        e.preventDefault();
        navigate(to)
    }}>{children}</a>;
}

function normalizePhone(phone) {
    return String(phone || '').replace(/[^+\d]/g, '');
}

function placementFor(map, key) {
    return map?.[key] ?? null;
}

function updatePlacementMap(setter, key, value) {
    setter(prev => ({...prev, [key]: value}));
}

function isImageMedia(m) {
    return m?.type?.startsWith('image/') || /\.hei[cf]$/i.test(m?.originalName || m?.url || '');
}

function isImageFile(f) {
    return f?.type?.startsWith('image/') || /\.hei[cf]$/i.test(f?.name || '');
}

function isHeicFile(f) {
    return /\.hei[cf]$/i.test(f?.name || '') || f?.type === 'image/heic' || f?.type === 'image/heif';
}

function CropImage({src, alt, crop}) {
    if (!src) return null;
    if (!crop || typeof crop.width !== 'number' || crop.width <= 0) {
        return <img src={src} alt={alt} className="work-media" style={{objectFit: 'cover'}}/>;
    }
    return <img
        src={src}
        alt={alt}
        className="work-media"
        style={{
            objectFit: 'fill',
            transformOrigin: '0 0',
            transform: `scale(${(100 / crop.width).toFixed(4)}, ${(100 / crop.height).toFixed(4)}) translate(${(-crop.x).toFixed(2)}%, ${(-crop.y).toFixed(2)}%)`,
        }}
    />;
}

function useImageSrc(media) {
    const [src, setSrc] = useState(!isHeicFile(media?.file) ? (media?.url || null) : null);
    useEffect(() => {
        if (!isHeicFile(media?.file)) { setSrc(media?.url || null); return; }
        let objectUrl = null;
        const fd = new FormData();
        fd.append('file', media.file);
        fetch('/api/admin/preview-convert', {method: 'POST', body: fd})
            .then(r => r.ok ? r.blob() : Promise.reject())
            .then(blob => { objectUrl = URL.createObjectURL(blob); setSrc(objectUrl); })
            .catch(() => setSrc(null));
        return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [media?.file, media?.url]);
    return src;
}

function formatDate(value) {
    if (!value) return 'No date';
    try {
        return new Date(value).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'});
    } catch {
        return 'No date';
    }
}

function FlagArtwork({variant = 'hero'}) {
    return <div className={`flag-art flag-art--${variant}`} aria-label="stylized wood American flag artwork">
        <div className="flag-canton">{Array.from({length: 24}).map((_, i) => <span key={i}>★</span>)}</div>
        {Array.from({length: 7}).map((_, i) => <div key={i}
                                                    className={`flag-stripe ${i % 2 === 0 ? 'red' : 'cream'}`}/>)}
        <div className="flag-lower-panel"><Shield size={variant === 'hero' ? 82 : 54}/><span>Custom Design Area</span>
        </div>
        <div className="wood-grain"/>
    </div>
}

function ImageModal({image, onClose}) {
    useEffect(() => {
        if (!image) return undefined;
        const onKeyDown = e => {
            if (e.key === 'Escape') onClose();
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [image, onClose]);
    if (!image) return null;
    return <div className="image-modal-backdrop" role="dialog" aria-modal="true" aria-label="View full-size image"
                onClick={onClose}>
        <button className="image-modal-close" type="button" aria-label="Close full-size image" onClick={onClose}><X
            size={24}/></button>
        <img className="image-modal-img" src={image.url} alt={image.originalName || 'Full-size custom flag work'}
             onClick={e => e.stopPropagation()}/>
    </div>;
}

function MediaPreview({media, compact = false, onImageOpen}) {
    const first = media?.[0];
    if (!first) return <div className="media-frame"><FlagArtwork variant={compact ? 'card' : 'hero'}/></div>;
    if (first.type?.startsWith('video/')) return <div className="media-frame">
        <video className="work-media" src={first.url} controls muted playsInline/>
    </div>;
    return <button type="button" className="media-frame media-frame-button" aria-label="Open larger image"
                   onClick={() => onImageOpen?.(first)}>
        <CropImage src={first.url} alt={first.originalName || 'Custom flag work'} crop={first.placement}/>
    </button>;
}

function WorkCard({item, i, onImageOpen}) {
    return <article className="gallery-card work-card">
        <div className="card-number">{String(i + 1).padStart(2, '0')}</div>
        <MediaPreview media={item.media} compact onImageOpen={onImageOpen}/>
        <div className="card-copy"><h3>{item.title}</h3>{item.price && <p className="price-tag">{item.price}</p>}
            <p>{item.description}</p></div>
    </article>
}

function SiteHeader({settings}) {
    return <header className="site-header"><Link to="/" className="brand"
                                                 aria-label={`${settings.brandName} home`}><span className="brand-mark"><Flag
        size={18}/></span><span>{settings.brandShort || settings.brandName}</span></Link>
        <nav>{(settings.nav || defaultSettings.nav).map(n => <Link key={n.path} to={n.path}
                                                                   className={n.path === '/contact' ? 'nav-cta' : ''}>{n.label}</Link>)}</nav>
    </header>
}

function HeroPage({settings, gallery, featured, onImageOpen}) {
    return <section className="page hero section-full">
        <div className="hero-bg"/>
        <div className="hero-content"><p className="eyebrow"><Star size={15}
                                                                   fill="currentColor"/> {settings.hero.eyebrow}</p>
            <h1>{settings.hero.title}</h1><p className="hero-copy">{settings.hero.body}</p>
            <div className="hero-actions"><Link to="/contact"
                                                className="button button-primary">{settings.hero.primaryCta} <ArrowRight
                size={18}/></Link><Link to="/work" className="button button-ghost">{settings.hero.secondaryCta}</Link>
            </div>
            <div className="proof-strip">{(settings.proof || []).map(p => <span key={p}><BadgeCheck
                size={16}/>{p}</span>)}</div>
        </div>
        <div className="hero-visual"><MediaPreview media={featured?.media} onImageOpen={onImageOpen}/></div>
    </section>
}

function WorkPage({settings, gallery, onImageOpen}) {
    return <section className="page section showcase">
        <div className="section-heading"><p className="eyebrow">{settings.work.eyebrow}</p>
            <h2>{settings.work.title}</h2><p>{settings.work.body}</p></div>
        <div className="gallery-grid gallery-grid--five">{gallery.map((item, i) => <WorkCard key={item.id || item.title}
                                                                                             item={item} i={i}
                                                                                             onImageOpen={onImageOpen}/>)}</div>
    </section>
}

function OptionsPage({settings, featured, onImageOpen}) {
    return <section className="page section options-section">
        <div className="real-work-callout"><MediaPreview media={featured?.media} onImageOpen={onImageOpen}/>
            <div><p className="eyebrow">Actual work examples</p><h2>{settings.options.title}</h2>
                <p>{settings.options.body}</p></div>
        </div>
        <div className="split">
            <div><p className="eyebrow"><Sparkles size={15}/> {settings.options.eyebrow}</p>
                <h2>{settings.options.title}</h2><p>{settings.options.body}</p></div>
            <div className="option-list">{(settings.options.items || []).map(option => <div className="option-item"
                                                                                            key={option}><Medal
                size={20}/><span>{option}</span></div>)}</div>
        </div>
    </section>
}

function ProcessPage({settings}) {
    return <section className="page section process-section">
        <div className="section-heading narrow"><p className="eyebrow">{settings.process.eyebrow}</p>
            <h2>{settings.process.title}</h2></div>
        <div className="process-grid">{(settings.process.steps || []).map((step, i) => <article key={i}>
            <span>{String(i + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.body}</p></article>)}</div>
    </section>
}

function ContactPage({settings}) {
    return <section className="page section cta-section">
        <div className="cta-card">
            <div><p className="eyebrow">{settings.contact.eyebrow}</p><h2>{settings.contact.title}</h2>
                <p>{settings.contact.body}</p></div>
            <div className="contact-panel"><a className="button button-primary"
                                              href={`mailto:${settings.email}?subject=Custom%20American%20Flag%20Inquiry`}><Mail
                size={18}/> Email Joe</a><a className="button button-ghost"
                                            href={`tel:${normalizePhone(settings.phone)}`}>{settings.phone}</a><p
                className="small-note">Email <strong>{settings.email}</strong> or call/text with your design idea, logo,
                branch, team, or reference image.</p></div>
        </div>
    </section>
}

function PublicSite({works, settings, route}) {
    const [modalImage, setModalImage] = useState(null);
    const gallery = works?.length ? works : fallbackGallery;
    const featured = gallery.find(w => w.featured) || gallery.find(w => w.media?.length) || gallery[0];
    let page = <HeroPage settings={settings} gallery={gallery} featured={featured} onImageOpen={setModalImage}/>;
    if (route === '/work') page = <WorkPage settings={settings} gallery={gallery} onImageOpen={setModalImage}/>;
    if (route === '/options') page = <OptionsPage settings={settings} featured={featured} onImageOpen={setModalImage}/>;
    if (route === '/process') page = <ProcessPage settings={settings}/>;
    if (route === '/contact') page = <ContactPage settings={settings}/>;
    return <main><SiteHeader settings={settings}/>{page}<ImageModal image={modalImage}
                                                                    onClose={() => setModalImage(null)}/></main>
}

function Admin({works, settings, reload, reloadSettings}) {
    const [me, setMe] = useState(null), [login, setLogin] = useState({
        username: '',
        password: ''
    }), [editing, setEditing] = useState(null), [msg, setMsg] = useState(''), [tab, setTab] = useState('work'), [notice, setNotice] = useState(null);
    const formRef = useRef(null);
    useEffect(() => {
        fetch('/api/admin/me').then(r => r.json()).then(setMe)
    }, []);

    async function doLogin(e) {
        e.preventDefault();
        setMsg('');
        const r = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(login)
        });
        const j = await r.json();
        if (!r.ok) return setMsg(j.error || 'Login failed');
        setMe({isAdmin: true, user: j.user});
    }

    async function logout() {
        await fetch('/api/admin/logout', {method: 'POST'});
        setMe({isAdmin: false});
    }

    function startEdit(work) {
        setTab('work');
        setEditing(work);
        setNotice(null);
        setTimeout(() => formRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'}), 50);
    }

    if (!me?.isAdmin) return <main className="admin-shell">
        <form className="login-card" onSubmit={doLogin}><p className="eyebrow"><Lock size={15}/> Private CMS</p>
            <h1>Joe’s Flags Admin</h1><p>Hidden login for adding/removing photos, videos, descriptions, prices, and
                website text.</p><input placeholder="Username" value={login.username}
                                        onChange={e => setLogin({...login, username: e.target.value})}/><input
                placeholder="Password" type="password" value={login.password}
                onChange={e => setLogin({...login, password: e.target.value})}/>{msg && <p className="error">{msg}</p>}
            <button className="button button-primary">Login</button>
        </form>
    </main>;
    return <main className="admin-shell admin-dashboard">
        <header>
            <div><p className="eyebrow"><Edit3 size={15}/> CMS Dashboard</p><h1>Manage Joe’s website</h1></div>
            <button onClick={logout} className="button button-ghost"><LogOut size={17}/> Logout</button>
        </header>
        {notice && <div className={`admin-notice admin-notice--${notice.type}`}>{notice.text}</div>}
        <div className="admin-tabs">
            <button className={tab === 'work' ? 'active' : ''} onClick={() => setTab('work')}><ImagePlus
                size={16}/> Work
            </button>
            <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}><Menu
                size={16}/> Text & Pages
            </button>
            <button className={tab === 'password' ? 'active' : ''} onClick={() => setTab('password')}><Lock
                size={16}/> Password
            </button>
        </div>
        {tab === 'work' && <><WorkForm formRef={formRef} editing={editing} setEditing={setEditing} reload={reload}
                                       setNotice={setNotice}/><WorkList works={works} setEditing={setEditing}
                                                                        reload={reload}
                                                                        startEdit={startEdit}/></>}{tab === 'settings' &&
        <SettingsForm settings={settings} reloadSettings={reloadSettings}/>} {tab === 'password' && <PasswordForm/>}
    </main>
}

function WorkList({works, setEditing, reload, startEdit}) {
    const [query, setQuery] = useState(''), [sortMode, setSortMode] = useState('newest');
    const visible = useMemo(() => works.filter(w => `${w.title} ${w.description} ${w.price}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => {
        if (sortMode === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortMode === 'title') return String(a.title || '').localeCompare(String(b.title || ''));
        if (sortMode === 'updated') return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }), [works, query, sortMode]);
    return <section className="admin-list">
        <div className="admin-list-toolbar">
            <div><h2>Current work items</h2><p>{visible.length} of {works.length} shown</p></div>
            <input placeholder="Search works" value={query} onChange={e => setQuery(e.target.value)}/><label>Sort
            by <select value={sortMode} onChange={e => setSortMode(e.target.value)}>
                <option value="newest">Newest added</option>
                <option value="oldest">Oldest added</option>
                <option value="updated">Recently updated</option>
                <option value="title">Title A–Z</option>
            </select></label></div>
        <div className="work-carousel-shell">
            <div className="work-carousel-list">{visible.map((w, i) => <article key={w.id} className="work-list-row">
                <div className="work-list-index">{String(i + 1).padStart(2, '0')}</div>
                <div className="work-list-thumb"><MediaPreview media={w.media} compact/></div>
                <div className="work-list-copy"><h3>{w.title}</h3><p>{w.description}</p>
                    <div className="work-list-meta">
                        <span>{w.price || 'No price'}</span><span>Added {formatDate(w.createdAt)}</span><span>Updated {formatDate(w.updatedAt)}</span><span>{w.media?.length || 0} media</span>
                    </div>
                </div>
                <div className="admin-actions">
                    <button type="button" onClick={() => startEdit(w)} className="button button-ghost"><Edit3
                        size={16}/> Edit
                    </button>
                    <button type="button" onClick={async () => {
                        if (confirm('Delete this work?')) {
                            await fetch('/api/admin/works/' + w.id, {method: 'DELETE'});
                            await reload();
                        }
                    }} className="button danger"><Trash2 size={16}/> Delete
                    </button>
                </div>
            </article>)}</div>
        </div>
    </section>
}

function HeicPreview({file, alt}) {
    const src = useImageSrc({file, url: null});
    if (!src) return <div className="heic-preview-note">Converting HEIC…</div>;
    return <div className="preview-thumb"><img src={src} alt={alt || file.name}/></div>;
}

function PlacementEditor({media, value, onChange}) {
    if (!isImageMedia(media)) return null;
    const imgSrc = useImageSrc(media);
    const [crop, setCrop] = useState({x: 0, y: 0});
    const [zoom, setZoom] = useState(1);
    const onCropComplete = useCallback((pct) => onChange(pct), [onChange]);

    if (!imgSrc) return <div className="heic-preview-note">Loading preview…</div>;

    return (
        <div className="placement-editor">
            <div className="placement-canvas">
                <Cropper
                    image={imgSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={0.86}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    initialCroppedAreaPercentages={value?.width ? value : undefined}
                    showGrid={false}
                    style={{containerStyle: {background: '#050912'}}}
                />
            </div>
            <div className="placement-editor-bar">
                <span>Drag to reposition · Scroll or pinch to zoom</span>
                <button type="button" className="button button-ghost"
                        onClick={() => { setCrop({x: 0, y: 0}); setZoom(1); onChange(null); }}>
                    Reset crop
                </button>
            </div>
        </div>
    );
}

function UploadPreview({files, title, price, description, placements, setPlacements}) {
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

function WorkForm({formRef, editing, setEditing, reload, setNotice}) {
    const [title, setTitle] = useState(''), [price, setPrice] = useState(''), [description, setDescription] = useState(''), [featured, setFeatured] = useState(false), [files, setFiles] = useState(null), [keep, setKeep] = useState([]), [busy, setBusy] = useState(false), [mediaPlacement, setMediaPlacement] = useState({}), [newMediaPlacement, setNewMediaPlacement] = useState({});
    useEffect(() => {
        setTitle(editing?.title || '');
        setPrice(editing?.price || '');
        setDescription(editing?.description || '');
        setFeatured(Boolean(editing?.featured));
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
            text: 'Please add at least one image or video.'
        });
        setBusy(true);
        setNotice({type: 'success', text: 'Saving...'});
        const fd = new FormData();
        Object.entries({
            title: title.trim(),
            price,
            description: description.trim(),
            featured: String(featured),
            keepMedia: keep.join(','),
            mediaPlacement: JSON.stringify(mediaPlacement),
            newMediaPlacement: JSON.stringify(newMediaPlacement)
        }).forEach(([k, v]) => fd.append(k, v));
        selectedFiles.forEach(f => fd.append('media', f));
        const url = editing ? '/api/admin/works/' + editing.id : '/api/admin/works';
        const r = await fetch(url, {method: editing ? 'PUT' : 'POST', body: fd});
        const j = await r.json().catch(() => ({}));
        setBusy(false);
        if (!r.ok) return setNotice({type: 'error', text: j.error || 'Save failed.'});
        setNotice({type: 'success', text: `Work ${editing ? 'updated' : 'added'} successfully.`});
        setEditing(null);
        setFiles(null);
        setNewMediaPlacement({});
        form.reset();
        await reload();
        formRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
    }

    return <form ref={formRef} className="work-form" onSubmit={submit} noValidate><p className="eyebrow"><Plus
        size={15}/> {editing ? 'Edit work' : 'Add a new work'}</p>
        <div className="form-grid"><input placeholder="Title" value={title}
                                          onChange={e => setTitle(e.target.value)}/><input
            placeholder="Price / quote text" value={price} onChange={e => setPrice(e.target.value)}/></div>
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)}/><label
            className="check"><input type="checkbox" checked={featured}
                                     onChange={e => setFeatured(e.target.checked)}/> Feature this item in the
            hero</label>{editing?.media?.length > 0 &&
            <div className="media-keep"><p>Existing media</p>{editing.media.map(m => <div key={m.url}
                                                                                          className="existing-media-editor">
                <label><input type="checkbox" checked={keep.includes(m.url)}
                              onChange={e => setKeep(e.target.checked ? [...keep, m.url] : keep.filter(x => x !== m.url))}/>{m.type?.startsWith('video/') ?
                    <Video/> : <ImagePlus/>}{m.originalName || m.url}</label>{keep.includes(m.url) && isImageMedia(m) &&
                <PlacementEditor media={{...m, placement: placementFor(mediaPlacement, m.url)}}
                                   value={placementFor(mediaPlacement, m.url) ?? m.placement ?? null}
                                   onChange={next => updatePlacementMap(setMediaPlacement, m.url, next)}/>}</div>)}
            </div>}<label className="upload"><ImagePlus/> Upload images/videos, including Apple HEIC <input type="file"
                                                                                                            accept="image/*,.heic,.heif,video/*"
                                                                                                            multiple
                                                                                                            onChange={e => {
                                                                                                                setFiles(e.target.files);
                                                                                                                setNewMediaPlacement({});
                                                                                                            }}/></label><UploadPreview
            files={files} title={title} price={price} description={description} placements={newMediaPlacement}
            setPlacements={setNewMediaPlacement}/>
        <div className="form-actions">
            <button className="button button-primary"
                    disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Add work'}</button>
            {editing && <button type="button" className="button button-ghost" onClick={() => setEditing(null)}>Cancel
                edit</button>}</div>
    </form>
}

function SettingsForm({settings, reloadSettings}) {
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
        {['hero', 'work', 'options', 'process', 'contact'].map(section => <fieldset key={section}>
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

function PasswordForm() {
    const [form, setForm] = useState({currentPassword: '', newPassword: '', confirm: ''}), [msg, setMsg] = useState('');

    async function save(e) {
        e.preventDefault();
        if (form.newPassword !== form.confirm) return setMsg('New passwords do not match.');
        const r = await fetch('/api/admin/change-password', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({currentPassword: form.currentPassword, newPassword: form.newPassword})
        });
        const j = await r.json();
        setMsg(r.ok ? 'Password updated. Use it next time you log in.' : j.error || 'Password update failed.');
    }

    return <form className="work-form" onSubmit={save}><p className="eyebrow"><Lock size={15}/> Change your password</p>
        <input type="password" placeholder="Current password" value={form.currentPassword}
               onChange={e => setForm({...form, currentPassword: e.target.value})}/><input type="password"
                                                                                           placeholder="New password"
                                                                                           value={form.newPassword}
                                                                                           onChange={e => setForm({
                                                                                               ...form,
                                                                                               newPassword: e.target.value
                                                                                           })}/><input type="password"
                                                                                                       placeholder="Confirm new password"
                                                                                                       value={form.confirm}
                                                                                                       onChange={e => setForm({
                                                                                                           ...form,
                                                                                                           confirm: e.target.value
                                                                                                       })}/>{msg &&
            <p className={msg.includes('updated') ? 'success' : 'error'}>{msg}</p>}
        <button className="button button-primary">Update password</button>
    </form>
}

function App() {
    const [works, setWorks] = useState([]), [config, setConfig] = useState(null), [settings, setSettings] = useState(defaultSettings), [route, setRoute] = useState(location.pathname);
    const isAdminRoute = useMemo(() => config && (route === config.adminPath || route.startsWith(config.adminPath + '/')), [route, config]);
    const reload = () => fetch('/api/works?ts=' + Date.now()).then(r => r.json()).then(setWorks);
    const reloadSettings = () => fetch('/api/settings?ts=' + Date.now()).then(r => r.json()).then(s => setSettings(mergeSettings(s)));
    useEffect(() => {
        fetch('/api/config').then(r => r.json()).then(setConfig);
        reload();
        reloadSettings();
        const onPop = () => setRoute(location.pathname);
        addEventListener('popstate', onPop);
        return () => removeEventListener('popstate', onPop);
    }, []);
    if (!config) return null;
    return isAdminRoute ? <Admin works={works} settings={settings} reload={reload} reloadSettings={reloadSettings}/> :
        <PublicSite works={works} settings={settings} route={route}/>
}

createRoot(document.getElementById('root')).render(<App/>);
