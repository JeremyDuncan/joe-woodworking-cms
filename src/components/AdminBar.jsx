import React, {useState} from 'react';
import {createPortal} from 'react-dom';
import {AlertTriangle, ChevronsDownUp, ChevronsUpDown, ChevronRight, Edit3, Eye, FilePlus, FileText, FolderInput, FolderPlus, LayoutDashboard, LayoutTemplate, ListTree, Map, Palette, RotateCcw, Save, Search, Trash2, Undo2} from 'lucide-react';
import {navigate} from '../lib/navigation.jsx';
import {pageStatus} from '../lib/links.js';
import {groupPages, pageLabel, sectionOf, slugifyPath} from '../lib/pages.js';
import {PagesPanel} from './PagesPanel.jsx';
import {ThemePanel} from './ThemePanel.jsx';
import {PanelHelp} from './PanelHelp.jsx';

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
function TemplateBadge({name}) {
    if (!name) return null;
    return <span className="template-badge" title={`Template: ${name}`}>
        <LayoutTemplate size={13}/><span>{name}</span>
    </span>;
}

function PageRow({p, route, status, templateName, onJump, onShowLinks, onMove}) {
    return <div className={`sitemap-link${p.path === route ? ' current' : ''}`}>
        <button type="button" className="sitemap-jump" onClick={() => onJump(p.path)}>
            <span className="page-name-line">
                <span className="sitemap-name">{pageLabel(p) || '(untitled)'}</span>
                <TemplateBadge name={templateName}/>
            </span>
            <span className="sitemap-path">{p.path}</span>
        </button>
        {onMove && p.path !== '/' && <button type="button" className="page-move" title="Move to a section"
                                             onClick={() => onMove(p.path)}><FolderInput size={14}/></button>}
        {status === 'linked'
            ? <button type="button" className="page-status linked" title="See what links here"
                      onClick={() => onShowLinks(p.path)}>{STATUS_LABEL[status]}</button>
            : <span className={`page-status ${status}`}>{STATUS_LABEL[status]}</span>}
    </div>;
}

// Searchable picker for choosing the section to move a page into. Lists existing sections,
// offers "top level" (no section), and lets you create a new one by typing a name.
function SectionPicker({page, sections, onPick, onClose}) {
    const [query, setQuery] = useState('');
    const current = sectionOf(page);
    const q = query.trim().toLowerCase();
    const filtered = sections.filter(s => !q || s.toLowerCase().includes(q));
    const typed = slugifyPath(query).replace(/^\//, '').split('/').filter(Boolean)[0] || '';
    const canCreate = typed && !sections.includes(typed);

    return createPortal(
        <div className="dialog-backdrop" onMouseDown={onClose}>
            <div className="dialog page-picker" onMouseDown={e => e.stopPropagation()}>
                <div className="page-picker-head">
                    <strong>Move “{pageLabel(page) || page.path}” to a section</strong>
                    <button type="button" className="theme-close" onClick={onClose}>×</button>
                </div>
                <div className="sitemap-search">
                    <Search size={15}/>
                    <input autoFocus type="text" placeholder="Search or type a new section…" value={query}
                           onChange={e => setQuery(e.target.value)}/>
                    {query && <button type="button" className="sitemap-search-clear" title="Clear"
                                      onClick={() => setQuery('')}>×</button>}
                </div>
                <div className="page-picker-list">
                    <button type="button" className={`picker-row${!current ? ' current' : ''}`}
                            onClick={() => onPick('')}>
                        <span className="sitemap-name">Top level</span>
                        <span className="sitemap-path">no section</span>
                    </button>
                    {filtered.map(s => <button key={s} type="button"
                                               className={`picker-row${s === current ? ' current' : ''}`}
                                               onClick={() => onPick(s)}>
                        <span className="sitemap-name">{s}</span>
                    </button>)}
                    {canCreate && <button type="button" className="picker-row picker-create"
                                          onClick={() => onPick(typed)}>
                        <FolderPlus size={14}/><span className="sitemap-name">Create “{typed}”</span>
                    </button>}
                    {!filtered.length && !canCreate && <p className="sitemap-empty">No sections yet — type a name to create one.</p>}
                </div>
            </div>
        </div>, document.body);
}

// Pages overview + management. Navigation links are grouped at the top; the remaining pages
// are grouped by section (the part before the slash). Admins can add a page, add a section,
// or add a page directly inside a section (which prefixes the section automatically).
function SitemapPanel({pages, route, layout, linkSources, sections: extraSections = [], onAddPage, onAddSection, onMovePage, onClose}) {
    const [query, setQuery] = useState('');
    const [linksFor, setLinksFor] = useState(null);
    const [movingPath, setMovingPath] = useState(null);
    const [open, setOpen] = useState({nav: true});
    const q = query.trim().toLowerCase();
    const match = p => !q || `${p.label || ''} ${p.path || ''}`.toLowerCase().includes(q);
    const all = pages || [];
    const navPages = all.filter(p => !p.hidden && match(p));
    const others = all.filter(p => p.hidden && match(p));
    const {roots, sections} = groupPages(others);
    const sectionNames = [...new Set([...Object.keys(sections), ...extraSections])].sort();
    // Every section that exists (across all pages + the explicitly-created empty ones), for
    // the "move to section" picker.
    const allSections = [...new Set([...all.map(p => sectionOf(p.path)).filter(Boolean), ...extraSections])].sort();

    const groupKeys = ['nav', ...sectionNames];
    const allOpen = groupKeys.every(k => !!open[k]);
    const expanded = k => !!q || !!open[k];
    const toggle = k => setOpen(o => ({...o, [k]: !o[k]}));
    const toggleAll = () => setOpen(allOpen ? {} : Object.fromEntries(groupKeys.map(k => [k, true])));

    const jump = path => {
        navigate(path);
        onClose();
    };
    const row = p => <PageRow key={p.path} p={p} route={route} status={pageStatus(p, linkSources)}
                              templateName={layout?.[p.path]?.templateName}
                              onJump={jump} onShowLinks={setLinksFor} onMove={setMovingPath}/>;
    const visibleSections = sectionNames.filter(sec => !q || (sections[sec] || []).length);
    const nothing = q && !navPages.length && !roots.length && !visibleSections.length;

    return <div className="pages-panel docked sitemap-panel">
        <div className="theme-panel-head">
            <strong><ListTree size={18}/> Pages</strong>
            <div className="panel-head-actions">
                <PanelHelp topic="pages"/>
                <button type="button" className="panel-icon-action" title="Add a page"
                        onClick={() => onAddPage()}><FilePlus size={16}/></button>
                <button type="button" className="panel-icon-action" title="Add a section"
                        onClick={onAddSection}><FolderPlus size={16}/></button>
                <button type="button" className="panel-icon-action"
                        title={allOpen ? 'Collapse all' : 'Expand all'} onClick={toggleAll}>
                    {allOpen ? <ChevronsDownUp size={16}/> : <ChevronsUpDown size={16}/>}
                </button>
                <button type="button" className="theme-close" onClick={onClose}>×</button>
            </div>
        </div>
        <div className="sitemap-search">
            <Search size={15}/>
            <input autoFocus type="text" placeholder="Search pages…" value={query}
                   onChange={e => setQuery(e.target.value)}/>
            {query && <button type="button" className="sitemap-search-clear" title="Clear"
                              onClick={() => setQuery('')}>×</button>}
        </div>

        <div className="sitemap-list">
            {nothing && <p className="sitemap-empty">No pages match “{query}”.</p>}

            {(!q || navPages.length > 0) && <div className="sitemap-section">
                <button type="button" className="sitemap-section-head" onClick={() => toggle('nav')}>
                    <ChevronRight size={15} className={`picker-caret${expanded('nav') ? ' open' : ''}`}/>
                    <span className="picker-section-name"><Map size={13}/> Navigation</span>
                    <span className="picker-count">{navPages.length}</span>
                </button>
                {expanded('nav') && (navPages.length
                    ? navPages.map(row)
                    : <p className="sitemap-empty">No menu links yet — add pages to the menu from the Navigation panel.</p>)}
            </div>}

            {roots.map(row)}

            {visibleSections.map(sec => <div key={sec} className="sitemap-section">
                <div className="sitemap-section-row">
                    <button type="button" className="sitemap-section-head" onClick={() => toggle(sec)}>
                        <ChevronRight size={15} className={`picker-caret${expanded(sec) ? ' open' : ''}`}/>
                        <span className="picker-section-name">{sec}</span>
                        <span className="picker-count">{(sections[sec] || []).length}</span>
                    </button>
                    <button type="button" className="sitemap-section-add" title={`Add a page in “${sec}”`}
                            onClick={() => onAddPage(sec)}><FilePlus size={14}/></button>
                </div>
                {expanded(sec) && ((sections[sec] || []).length
                    ? sections[sec].map(row)
                    : <p className="sitemap-empty">Empty section — use the + to add a page here.</p>)}
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

        {movingPath && <SectionPicker page={all.find(p => p.path === movingPath) || {path: movingPath}}
                                      sections={allSections}
                                      onPick={sec => {
                                          onMovePage(movingPath, sec);
                                          setMovingPath(null);
                                      }}
                                      onClose={() => setMovingPath(null)}/>}
    </div>;
}

function DeletePageModal({page, links, onConfirm, onClose}) {
    const label = pageLabel(page) || page?.path;
    const hasLinks = links.length > 0;
    return createPortal(
        <div className="dialog-backdrop" onMouseDown={onClose}>
            <div className="dialog delete-page-modal" onMouseDown={e => e.stopPropagation()}>
                <div className="delete-page-head">
                    <AlertTriangle size={20}/>
                    <div>
                        <strong>Delete {label}?</strong>
                        <span>{page?.path}</span>
                    </div>
                </div>
                <p className="dialog-text">
                    This page will be removed when you save your changes.
                    {hasLinks ? ' The pages below link to it and will be unlinked.' : ' No other pages currently link to it.'}
                </p>
                {hasLinks && <ul className="delete-page-links">
                    {links.map(s => <li key={s.route}>
                        <span>{s.label}</span>
                        <small>{s.route}</small>
                    </li>)}
                </ul>}
                <div className="dialog-actions">
                    <button type="button" className="button button-ghost" onClick={onClose}>Cancel</button>
                    <button type="button" className="button danger" onClick={onConfirm}>Delete page</button>
                </div>
            </div>
        </div>, document.body);
}

// Top admin banner + top-left icon toolbar. Out of edit mode it shows only Edit site /
// Dashboard; in edit mode it shows the full set of editing tools.
const PUBLISH_LABEL = {published: 'Published', modified: 'Edited · not live', draft: 'Draft · not live'};

export function AdminBar({editing, preview, saveState, adminPath, currentPage, currentTemplate, linkSources, staging, publishStatus, onPublish, onUnpublish, onEnter, onSave, onDiscard, onUndo, canUndo, onAddPage, onAddSection, onMovePage, sections, onDeletePage, onTogglePreview, pagesProps, themeProps}) {
    const [panel, setPanel] = useState(null); // 'nav' | 'sitemap' | 'templates' | 'theme'
    const [deleteOpen, setDeleteOpen] = useState(false);
    const toggle = p => setPanel(cur => (cur === p ? null : p));
    const current = (pagesProps.pages || []).find(p => p.path === pagesProps.route);
    const canDeleteCurrent = editing && !preview && current?.path && current.path !== '/';
    const inboundLinks = current?.path ? (linkSources[current.path] || []) : [];

    return <>
        <div className="admin-bar">
            <div className="admin-bar-icons">
                {!editing && <>
                    <IconBtn title="Edit site" variant="primary" onClick={onEnter}><Edit3 size={19}/></IconBtn>
                </>}
                {editing && <>
                    <IconBtn title={saveState === 'saving' ? 'Saving…' : 'Save changes'} variant="save"
                             onClick={onSave} disabled={saveState === 'saving'}><Save size={19}/></IconBtn>
                    <IconBtn title="Discard changes" variant="danger" onClick={onDiscard}><Undo2 size={19}/></IconBtn>
                    <IconBtn title={canUndo ? 'Undo last change' : 'Nothing to undo'} onClick={onUndo}
                             disabled={!canUndo}><RotateCcw size={19}/></IconBtn>
                    <span className="admin-bar-sep"/>
                    <IconBtn title="Pages" active={panel === 'sitemap'} onClick={() => toggle('sitemap')}>
                        <ListTree size={19}/></IconBtn>
                    <IconBtn title="Navigation" active={panel === 'nav'} onClick={() => toggle('nav')}>
                        <Map size={19}/></IconBtn>
                    <IconBtn title="New page" onClick={() => onAddPage()}><FilePlus size={19}/></IconBtn>
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
                <FileText size={15}/> <span>{currentPage}</span>
                <TemplateBadge name={currentTemplate}/>
                {staging && editing && <span className="publish-controls">
                    <span className={`publish-badge ${publishStatus}`}
                          title="Visitors only see published pages">{PUBLISH_LABEL[publishStatus]}</span>
                    {publishStatus !== 'published' && <button type="button" className="publish-btn go"
                                                              onClick={onPublish}>Publish</button>}
                    {publishStatus !== 'draft' && <button type="button" className="publish-btn stop"
                                                          onClick={onUnpublish}>Unpublish</button>}
                </span>}
                {canDeleteCurrent && <button type="button" className="admin-page-delete" title="Delete this page"
                                             onClick={() => setDeleteOpen(true)}>
                    <Trash2 size={14}/>
                </button>}
            </div>}

            <div className="admin-bar-status">
                <IconBtn title="Dashboard" href={adminPath}><LayoutDashboard size={19}/></IconBtn>
                <div className="admin-bar-label">
                    <span className="admin-bar-dot"/>
                    {preview ? 'Preview' : editing ? 'Edit Mode' : 'Admin Mode'}
                    {saveState === 'error' && <span className="admin-bar-error">· Save failed</span>}
                </div>
            </div>
        </div>

        {editing && !preview && panel === 'sitemap' &&
            <SitemapPanel pages={pagesProps.pages} route={pagesProps.route} layout={pagesProps.layout}
                          linkSources={linkSources} sections={sections}
                          onAddPage={onAddPage} onAddSection={onAddSection} onMovePage={onMovePage}
                          onClose={() => setPanel(null)}/>}
        {editing && !preview && panel === 'nav' &&
            <PagesPanel {...pagesProps} tab="nav" docked onClose={() => setPanel(null)}/>}
        {editing && !preview && panel === 'templates' &&
            <PagesPanel {...pagesProps} tab="templates" docked onClose={() => setPanel(null)}/>}
        {editing && !preview && panel === 'theme' &&
            <ThemePanel {...themeProps} docked onClose={() => setPanel(null)}/>}
        {deleteOpen && current &&
            <DeletePageModal page={current} links={inboundLinks}
                             onClose={() => setDeleteOpen(false)}
                             onConfirm={() => {
                                 setDeleteOpen(false);
                                 setPanel(null);
                                 onDeletePage(current.path);
                             }}/>}
    </>;
}
