import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {fallbackGallery} from '../data/defaults.js';
import {buildLinkSources, retargetLayout, unlinkLayoutTarget} from '../lib/links.js';
import {lastSegment, pageLabel, samePage, sectionOf, slugifyPath} from '../lib/pages.js';
import {SiteHeader} from '../components/SiteHeader.jsx';
import {FOOTER_KEY, SiteFooter} from '../components/SiteFooter.jsx';
import {ImageModal} from '../components/ImageModal.jsx';
import {AdminBar} from '../components/AdminBar.jsx';
import {EditProvider} from '../lib/edit.jsx';
import {applyTheme} from '../lib/theme.js';
import {navigate} from '../lib/navigation.jsx';
import {confirmDialog, notify, promptDialog} from '../lib/dialog.jsx';
import {siteVersion} from '../lib/version.js';
import {BuilderPage} from './BuilderPage.jsx';

function newId() {
    return `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function PublicSite({items, settings, route, isAdmin, adminPath, reloadSettings, reloadItems}) {
    const [modalImage, setModalImage] = useState(null);
    const [editing, setEditing] = useState(false);
    const [preview, setPreview] = useState(false); // "Web view": render the draft as it'll look, without exiting edit mode
    const [draft, setDraft] = useState(settings);
    const [saveState, setSaveState] = useState(null);
    const [templateRestore, setTemplateRestore] = useState({});

    // The effective editing flag for rendering: in preview we show the draft in view mode.
    const live = editing && !preview;

    // Keep the draft in sync with saved settings while not actively editing.
    useEffect(() => {
        if (!editing) setDraft(settings);
    }, [settings, editing]);

    // Apply the active theme (draft while editing, saved otherwise) live via CSS vars.
    const view = editing ? draft : settings;
    useEffect(() => {
        applyTheme(view.theme);
    }, [view.theme]);

    // Publish workflow. Once a site is "migrated", pages are only live for visitors after
    // they're published (a snapshot kept in view.published). Admins always see the draft.
    // The footer is global, so it's never staged — it always shows the live version.
    const staging = !!view.publishMigrated;
    const publishStatusOf = path => {
        if (!staging) return 'published';
        const pub = view.published?.[path];
        if (!pub) return 'draft';
        return samePage(pub, view.layout?.[path]) ? 'published' : 'modified';
    };
    // What visitors render: published page bodies (+ the live footer), with the menu limited
    // to published pages. Admins (and un-migrated sites) render everything as a draft.
    const renderView = (isAdmin || !staging) ? view : {
        ...view,
        layout: {...(view.published || {}), [FOOTER_KEY]: view.layout?.[FOOTER_KEY]},
        nav: (view.nav || []).filter(n => view.published?.[n.path])
    };
    const visitorUnavailable = !isAdmin && staging && route !== FOOTER_KEY && !view.published?.[route];

    // Which pages link to which (for page status badges + "what links here").
    const linkSources = useMemo(() => buildLinkSources(view.layout, view.nav), [view.layout, view.nav]);

    // Undo history for the current edit session: each setField snapshots the draft *before*
    // the change. Rapid edits to the same path (typing, or the many updates during one drag)
    // are coalesced into a single step so one undo reverts the whole gesture, not each frame.
    const history = useRef([]);
    const undoMark = useRef({path: null, time: 0});
    const draftRef = useRef(settings);
    const [undoCount, setUndoCount] = useState(0);
    useEffect(() => {
        draftRef.current = draft;
    });

    const resetHistory = useCallback(() => {
        history.current = [];
        undoMark.current = {path: null, time: 0};
        setUndoCount(0);
    }, []);

    const setField = useCallback((path, value) => {
        const key = path.join('|');
        const now = Date.now();
        const mark = undoMark.current;
        const coalesce = key === mark.path && (now - mark.time) < 600;
        const prev = draftRef.current;
        // One snapshot per gesture; the reference check also collapses a synchronous batch of
        // edits (e.g. add-page touches nav + layout) into a single undo step.
        if (!coalesce && history.current[history.current.length - 1] !== prev) {
            history.current.push(prev);
            if (history.current.length > 200) history.current.shift();
            setUndoCount(history.current.length);
        }
        undoMark.current = {path: key, time: now};
        setDraft(d => {
            const n = structuredClone(d);
            let cur = n;
            path.slice(0, -1).forEach(k => cur = cur[k]);
            const last = path.at(-1);
            // `value` may be an updater fn so callers can derive from the LATEST state — vital for
            // slow async edits (e.g. a long video upload) that must not clobber concurrent changes.
            cur[last] = typeof value === 'function' ? value(cur[last]) : value;
            return n;
        });
    }, []);

    const undo = useCallback(() => {
        if (!history.current.length) return;
        const prev = history.current.pop();
        undoMark.current = {path: null, time: 0};
        setUndoCount(history.current.length);
        setDraft(prev);
    }, []);

    async function save() {
        const itemNeedsImage = Object.values(draft.layout || {}).some(pg =>
            (pg?.blocks || []).some(b => (b.type === 'item' || b.type === 'work') && !(b.props && b.props.image)));
        if (itemNeedsImage) {
            notify('Each Item needs a picture before the page can be saved.', 'error');
            return;
        }
        setSaveState('saving');
        try {
            const r = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(draft)
            });
            if (!r.ok) {
                setSaveState('error');
                return;
            }
            await reloadSettings();
            if (reloadItems) await reloadItems();
            setEditing(false);
            setPreview(false);
            setTemplateRestore({});
            resetHistory();
            setSaveState(null);
            notify('Changes saved', 'success');
        } catch {
            setSaveState('error');
        }
    }

    async function discard() {
        if (!(await confirmDialog('Discard all unsaved changes?', {danger: true, okLabel: 'Discard'}))) return;
        setDraft(settings);
        setEditing(false);
        setPreview(false);
        setTemplateRestore({});
        resetHistory();
        setSaveState(null);
    }

    // Persist a named preset immediately (merges only that key on the server, so it
    // doesn't commit other in-progress edits). No reloadSettings — that would revert
    // the live draft.
    async function persistKey(key, value) {
        await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({[key]: value})
        });
    }

    async function saveThemePreset(name) {
        const themeCopy = JSON.parse(JSON.stringify(draft.theme || {}));
        setField(['themes', name], themeCopy);
        await persistKey('themes', {...(draft.themes || {}), [name]: themeCopy});
    }

    async function deleteThemePreset(name) {
        const nextThemes = {...(draft.themes || {})};
        delete nextThemes[name];
        setField(['themes'], nextThemes);
        setField(['theme', 'name'], '');
        await persistKey('themes', nextThemes);
    }

    // ---- Page management ----
    // Create a page. When `section` is given the name is placed inside it, so the page's
    // address becomes <section>/<name> automatically. New pages start hidden (not in nav).
    async function addPage(section) {
        const sec = typeof section === 'string' ? section : '';
        const name = await promptDialog(sec
            ? `New page name inside “${sec}” (becomes ${sec}/your-name)`
            : 'New page name (use a slash for sections, e.g. menu/pizza)');
        if (!name || !name.trim()) return;
        const path = slugifyPath(sec ? `${sec}/${name}` : name);
        if (path === '/') return;
        const nav = draft.nav || [];
        if (nav.some(n => n.path === path)) {
            notify('A page with that address already exists.', 'error');
            return;
        }
        // The nav label defaults to the last path segment (so /menu/pizza shows "pizza").
        setField(['nav'], [...nav, {label: lastSegment(path), path, hidden: true}]);
        setField(['layout', path], {columns: 1, blocks: []});
        navigate(path);
    }

    // Create an (initially empty) section so pages can be filed under it. Sections are just
    // the first path segment; we remember empty ones in settings.sections so they still show.
    async function addSection() {
        const name = await promptDialog('New section name (e.g. Menu)');
        if (!name || !name.trim()) return;
        const sec = slugifyPath(name).replace(/^\//, '').split('/').filter(Boolean)[0];
        if (!sec) return;
        const sections = draft.sections || [];
        const taken = sections.includes(sec) || (draft.nav || []).some(n => sectionOf(n.path) === sec);
        if (taken) {
            notify('That section already exists.', 'error');
            return;
        }
        setField(['sections'], [...sections, sec]);
    }

    // Reorder a nav link by swapping it with its nearest *visible* neighbour (dir = -1 up
    // / +1 down) — hidden pages are ignored so the visible menu order is what changes.
    function moveNav(path, dir) {
        const nav = [...(draft.nav || [])];
        const visible = nav.map((n, i) => i).filter(i => !nav[i].hidden);
        const pos = visible.findIndex(i => nav[i].path === path);
        const target = pos + dir;
        if (pos < 0 || target < 0 || target >= visible.length) return;
        const i = visible[pos], j = visible[target];
        [nav[i], nav[j]] = [nav[j], nav[i]];
        setField(['nav'], nav);
    }

    function toggleNav(path) {
        if (path === '/') return;
        setField(['nav'], (draft.nav || []).map(n => {
            if (n.path !== path) return n;
            const nextHidden = !n.hidden;
            const sectioned = (n.path || '').replace(/^\//, '').split('/').filter(Boolean).length > 1;
            return {...n, hidden: nextHidden, label: (!nextHidden && sectioned) ? lastSegment(n.path) : n.label};
        }));
    }

    function toggleCta(path) {
        setField(['nav'], (draft.nav || []).map(n => n.path === path ? {...n, cta: !n.cta} : n));
    }

    function renamePage(path, label) {
        setField(['nav'], (draft.nav || []).map(n => n.path === path ? {...n, label} : n));
    }

    function changePath(oldPath, rawNew) {
        if (oldPath === '/') return;
        // Slashes are allowed so pages can be organised into sections, e.g. /pizza/sales.
        const np = slugifyPath(rawNew);
        if (np === oldPath || np === '/') return;
        const nav = draft.nav || [];
        if (nav.some(n => n.path === np)) {
            notify('That address is already used by another page.', 'error');
            return;
        }
        // Move the layout to the new key, then retarget every link that pointed at the old
        // path (block links, inline text links, and per-list-item links).
        const moved = {};
        Object.entries(draft.layout || {}).forEach(([rk, pg]) => {
            moved[rk === oldPath ? np : rk] = pg;
        });
        setField(['layout'], retargetLayout(moved, oldPath, np));
        setField(['nav'], nav.map(n => {
            if (n.path !== oldPath) return n;
            const wasPathLabel = !n.label || n.label === lastSegment(oldPath);
            return {...n, path: np, label: wasPathLabel ? lastSegment(np) : n.label};
        }));
        if (route === oldPath) navigate(np);
    }

    // Move a page into a section (or out of any section when `section` is blank) by changing
    // its address to <section>/<leaf>; changePath repoints every link to it.
    function movePageToSection(path, section) {
        if (path === '/') return;
        const leaf = lastSegment(path);
        changePath(path, section ? `${section}/${leaf}` : leaf);
    }

    async function deletePage(path) {
        if (path === '/') return;
        setField(['nav'], (draft.nav || []).filter(n => n.path !== path));
        const nextLayout = unlinkLayoutTarget(draft.layout || {}, path);
        delete nextLayout[path];
        setField(['layout'], nextLayout);
        if (route === path) navigate('/');
    }

    // ---- Publish / unpublish ----
    // These commit immediately (they persist the draft and stay in edit mode) and append to
    // the publish log shown in the dashboard. They're not part of the undo stack.
    async function persistDraft(next) {
        setDraft(next);
        try {
            await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(next)
            });
            await reloadSettings();
        } catch {
            notify('Could not save the publish change.', 'error');
        }
    }

    function logEntry(path, action) {
        const label = pageLabel((draft.nav || []).find(n => n.path === path)) || path;
        return {path, label, action, at: new Date().toISOString()};
    }

    function publishPage(path) {
        if (!path) return;
        const snapshot = structuredClone(draft.layout?.[path] || {columns: 1, blocks: []});
        const entry = logEntry(path, 'published');
        persistDraft({
            ...draft,
            published: {...(draft.published || {}), [path]: snapshot},
            publishLog: [entry, ...(draft.publishLog || [])].slice(0, 1000),
            publishMigrated: true
        });
        notify(`Published “${entry.label}”`, 'success');
    }

    function unpublishPage(path) {
        if (!path) return;
        const published = {...(draft.published || {})};
        delete published[path];
        const entry = logEntry(path, 'unpublished');
        persistDraft({
            ...draft, published,
            publishLog: [entry, ...(draft.publishLog || [])].slice(0, 1000),
            publishMigrated: true
        });
        notify(`Unpublished “${entry.label}”`, 'success');
    }

    // ---- Layout templates ----
    async function saveTemplate(name) {
        const cur = draft.layout?.[route];
        if (!cur) return;
        const copy = JSON.parse(JSON.stringify(cur));
        delete copy.templateName;
        setField(['layouts', name], copy);
        setField(['layout', route, 'templateName'], name);
        await persistKey('layouts', {...(draft.layouts || {}), [name]: copy});
    }

    function applyTemplate(name) {
        const tpl = (draft.layouts || {})[name];
        if (!tpl) return;
        const original = draft.layout?.[route];
        if (original && !templateRestore[route]) {
            setTemplateRestore(r => ({...r, [route]: JSON.parse(JSON.stringify(original))}));
        }
        const copy = {
            columns: tpl.columns || 1, templateName: name,
            blocks: (tpl.blocks || []).map(b => ({...b, id: newId(), props: {...b.props}}))
        };
        setField(['layout', route], copy);
    }

    function revertTemplateApply() {
        const original = templateRestore[route];
        if (!original) return;
        setField(['layout', route], JSON.parse(JSON.stringify(original)));
        setTemplateRestore(r => {
            const next = {...r};
            delete next[route];
            return next;
        });
    }

    async function updateTemplate() {
        const cur = draft.layout?.[route];
        const name = cur?.templateName;
        if (!name) return;
        const copy = JSON.parse(JSON.stringify(cur));
        delete copy.templateName;
        setField(['layouts', name], copy);
        await persistKey('layouts', {...(draft.layouts || {}), [name]: copy});
    }

    async function deleteTemplate(name) {
        if (!name) return;
        if (!(await confirmDialog(`Delete the layout “${name}”?`, {danger: true, okLabel: 'Delete'}))) return;
        const nextLayouts = {...(draft.layouts || {})};
        delete nextLayouts[name];
        setField(['layouts'], nextLayouts);
        if (draft.layout?.[route]?.templateName === name) setField(['layout', route, 'templateName'], undefined);
        await persistKey('layouts', nextLayouts);
    }

    const gallery = items ?? fallbackGallery;
    // The representative item image used as the default for Image blocks: first item
    // that has media (no "featured" flag anymore).
    const featured = gallery.find(w => w.media?.length) || gallery[0];

    return <EditProvider editing={live} setField={setField} reload={reloadSettings}>
        <main className={`${isAdmin ? 'admin-chrome ' : ''}${live ? 'is-editing' : ''}`.trim() || undefined}>
            <SiteHeader settings={renderView}/>
            {visitorUnavailable
                ? <section className="page section page-unavailable">
                    <h1>Page not available</h1>
                    <p>This page hasn’t been published yet.</p>
                </section>
                : <BuilderPage route={route} settings={renderView} featured={featured} items={gallery}
                               onImageOpen={setModalImage}/>}
            <SiteFooter settings={renderView} items={gallery} onImageOpen={setModalImage}/>
            <ImageModal image={modalImage} onClose={() => setModalImage(null)}/>
            {isAdmin &&
                <AdminBar editing={editing} preview={preview} saveState={saveState} adminPath={adminPath}
                          currentPage={pageLabel((view.nav || []).find(n => n.path === route)) || route}
                          currentTemplate={view.layout?.[route]?.templateName}
                          linkSources={linkSources}
                          staging={staging} publishStatus={publishStatusOf(route)}
                          onPublish={() => publishPage(route)} onUnpublish={() => unpublishPage(route)}
                          onEnter={() => {
                              resetHistory();
                              setEditing(true);
                          }} onSave={save} onDiscard={discard} onAddPage={addPage} onAddSection={addSection}
                          onMovePage={movePageToSection} sections={view.sections || []}
                          onDeletePage={deletePage}
                          onUndo={undo} canUndo={undoCount > 0}
                          onTogglePreview={() => setPreview(p => !p)}
                          version={siteVersion(settings.rev)}
                          pagesProps={{
                              pages: view.nav, route, layout: view.layout, templates: view.layouts,
                              currentTemplate: view.layout?.[route]?.templateName,
                              onAddPage: addPage, onToggleNav: toggleNav,
                              onToggleCta: toggleCta, onRename: renamePage, onChangePath: changePath, onMove: moveNav,
                              onSaveTemplate: saveTemplate, onApplyTemplate: applyTemplate,
                              canRevertTemplate: !!templateRestore[route], onRevertTemplate: revertTemplateApply,
                              onUpdateTemplate: updateTemplate, onDeleteTemplate: deleteTemplate
                          }}
                          themeProps={{
                              theme: view.theme, themes: view.themes, setField,
                              onSavePreset: saveThemePreset, onDeletePreset: deleteThemePreset
                          }}/>}
        </main>
    </EditProvider>;
}
