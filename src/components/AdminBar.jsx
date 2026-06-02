import React, {useState} from 'react';
import {createPortal} from 'react-dom';
import {ChevronRight, Edit3, Eye, FilePlus, FileText, LayoutDashboard, LayoutTemplate, ListTree, Map, Palette, Save, Search, Undo2} from 'lucide-react';
import {navigate} from '../lib/navigation.jsx';
import {pageStatus} from '../lib/links.js';
import {groupPages, pageLabel} from '../lib/pages.js';
import {PagesPanel} from './PagesPanel.jsx';
import {ThemePanel} from './ThemePanel.jsx';

// One icon button with an instant custom tooltip (CSS, via data-tip). Renders as a
// link when `href` is given.
function IconBtn({title, onClick, href, active, variant, disabled, children}) {
    const cls = `admin-icon-btn${active ? ' active' : ''}${variant ? ' ' + variant : ''}`;
    if (href) return <a className={cls} href={href} data-tip={title} aria-label={title}>{children}</a>;
    return <button type="button" className={cls} data-tip={title} aria-label={title}
                   onClick={onClick} disabled={disabled}>{children}</button>;
}

const STATUS_LABEL = {navigation: 'navigation', linked: 'linked', unlinked: 'unlinked'};

// One page row: jump to it, with a status badge. The "linked" badge is clickable to
// reveal which pages link here.
function PageRow({p, route, status, onJump, onShowLinks}) {
    return <div className={`sitemap-link${p.path === route ? ' current' : ''}`}>
        <button type="button" className="sitemap-jump" onClick={() => onJump(p.path)}>
            <span className="sitemap-name">{pageLabel(p) || '(untitled)'}</span>
            <span className="sitemap-path">{p.path}</span>
        </button>
        {status === 'linked'
            ? <button type="button" className="page-status linked" title="See what links here"
                      onClick={() => onShowLinks(p.path)}>{STATUS_LABEL[status]}</button>
            : <span className={`page-status ${status}`}>{STATUS_LABEL[status]}</span>}
    </div>;
}

// Read-only overview of every page; click to jump. Searchable, grouped by section
// (first path segment), with a status badge per page.
function SitemapPanel({pages, route, linkSources, onClose}) {
    const [query, setQuery] = useState('');
    const [linksFor, setLinksFor] = useState(null);
    const [open, setOpen] = useState({});
    const q = query.trim().toLowerCase();
    const visible = (pages || []).filter(p => !q || `${p.label || ''} ${p.path || ''}`.toLowerCase().includes(q));
    const {roots, sections} = groupPages(visible);
    const expanded = sec => !Object.prototype.hasOwnProperty.call(open, sec) ? true : !!open[sec];

    const jump = path => {
        navigate(path);
        onClose();
    };
    const row = p => <PageRow key={p.path} p={p} route={route} status={pageStatus(p, linkSources)}
                              onJump={jump} onShowLinks={setLinksFor}/>;

    return <div className="pages-panel docked sitemap-panel">
        <div className="theme-panel-head">
            <strong><ListTree size={18}/> Pages</strong>
            <button type="button" className="theme-close" onClick={onClose}>×</button>
        </div>
        <div className="sitemap-search">
            <Search size={15}/>
            <input autoFocus type="text" placeholder="Search pages…" value={query}
                   onChange={e => setQuery(e.target.value)}/>
            {query && <button type="button" className="sitemap-search-clear" title="Clear"
                              onClick={() => setQuery('')}>×</button>}
        </div>

        <div className="sitemap-list">
            {visible.length === 0 && <p className="sitemap-empty">No pages match “{query}”.</p>}
            {roots.map(row)}
            {Object.keys(sections).sort().map(sec => <div key={sec} className="sitemap-section">
                <button type="button" className="sitemap-section-head" onClick={() => setOpen(o => ({...o, [sec]: !o[sec]}))}>
                    <ChevronRight size={15} className={`picker-caret${expanded(sec) ? ' open' : ''}`}/>
                    <span className="picker-section-name">{sec}</span>
                    <span className="picker-count">{sections[sec].length}</span>
                </button>
                {expanded(sec) && sections[sec].map(row)}
            </div>)}
        </div>

        {linksFor && createPortal(
            <div className="dialog-backdrop" onMouseDown={() => setLinksFor(null)}>
                <div className="dialog links-modal" onMouseDown={e => e.stopPropagation()}>
                    <p className="dialog-text">Pages that link to <strong>{linksFor}</strong></p>
                    <ul className="links-modal-list">
                        {(linkSources[linksFor] || []).map(s => <li key={s.route}>
                            <button type="button" onClick={() => {
                                navigate(s.route === '__footer__' ? route : s.route);
                                setLinksFor(null);
                                onClose();
                            }}>{s.label}<span className="links-modal-path">{s.route}</span></button>
                        </li>)}
                    </ul>
                    <div className="dialog-actions">
                        <button type="button" className="button button-ghost"
                                onClick={() => setLinksFor(null)}>Close
                        </button>
                    </div>
                </div>
            </div>, document.body)}
    </div>;
}

// Top admin banner + top-left icon toolbar. Out of edit mode it shows only Edit site /
// Dashboard; in edit mode it shows the full set of editing tools.
export function AdminBar({editing, preview, saveState, adminPath, currentPage, linkSources, onEnter, onSave, onDiscard, onAddPage, onTogglePreview, pagesProps, themeProps}) {
    const [panel, setPanel] = useState(null); // 'nav' | 'sitemap' | 'templates' | 'theme'
    const toggle = p => setPanel(cur => (cur === p ? null : p));

    return <>
        <div className="admin-bar">
            <div className="admin-bar-icons">
                {!editing && <>
                    <IconBtn title="Edit site" variant="primary" onClick={onEnter}><Edit3 size={19}/></IconBtn>
                    <IconBtn title="Dashboard" href={adminPath}><LayoutDashboard size={19}/></IconBtn>
                </>}
                {editing && <>
                    <IconBtn title={saveState === 'saving' ? 'Saving…' : 'Save changes'} variant="save"
                             onClick={onSave} disabled={saveState === 'saving'}><Save size={19}/></IconBtn>
                    <IconBtn title="Discard changes" variant="danger" onClick={onDiscard}><Undo2 size={19}/></IconBtn>
                    <span className="admin-bar-sep"/>
                    <IconBtn title="Pages" active={panel === 'sitemap'} onClick={() => toggle('sitemap')}>
                        <ListTree size={19}/></IconBtn>
                    <IconBtn title="Navigation" active={panel === 'nav'} onClick={() => toggle('nav')}>
                        <Map size={19}/></IconBtn>
                    <IconBtn title="New page" onClick={onAddPage}><FilePlus size={19}/></IconBtn>
                    <IconBtn title="Page templates" active={panel === 'templates'} onClick={() => toggle('templates')}>
                        <LayoutTemplate size={19}/></IconBtn>
                    <IconBtn title="Theme" active={panel === 'theme'} onClick={() => toggle('theme')}>
                        <Palette size={19}/></IconBtn>
                    <span className="admin-bar-sep"/>
                    <IconBtn title={preview ? 'Back to editing' : 'Web view (preview)'} active={preview}
                             onClick={onTogglePreview}><Eye size={19}/></IconBtn>
                </>}
            </div>

            {currentPage && <div className="admin-bar-page" title="Current page">
                <FileText size={15}/> {currentPage}
            </div>}

            <div className="admin-bar-label">
                <span className="admin-bar-dot"/>
                {preview ? 'Preview' : editing ? 'Edit Mode' : 'Admin Mode'}
                {saveState === 'error' && <span className="admin-bar-error">· Save failed</span>}
            </div>
        </div>

        {editing && !preview && panel === 'sitemap' &&
            <SitemapPanel pages={pagesProps.pages} route={pagesProps.route} linkSources={linkSources}
                          onClose={() => setPanel(null)}/>}
        {editing && !preview && panel === 'nav' &&
            <PagesPanel {...pagesProps} tab="nav" docked onClose={() => setPanel(null)}/>}
        {editing && !preview && panel === 'templates' &&
            <PagesPanel {...pagesProps} tab="templates" docked onClose={() => setPanel(null)}/>}
        {editing && !preview && panel === 'theme' &&
            <ThemePanel {...themeProps} docked onClose={() => setPanel(null)}/>}
    </>;
}
