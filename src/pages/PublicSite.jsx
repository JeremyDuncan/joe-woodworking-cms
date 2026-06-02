import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {fallbackGallery} from '../data/defaults.js';
import {buildLinkSources, unlinkLayoutTarget} from '../lib/links.js';
import {lastSegment, pageLabel, slugifyPath} from '../lib/pages.js';
import {SiteHeader} from '../components/SiteHeader.jsx';
import {SiteFooter} from '../components/SiteFooter.jsx';
import {ImageModal} from '../components/ImageModal.jsx';
import {AdminBar} from '../components/AdminBar.jsx';
import {EditProvider} from '../lib/edit.jsx';
import {applyTheme} from '../lib/theme.js';
import {navigate} from '../lib/navigation.jsx';
import {confirmDialog, notify, promptDialog} from '../lib/dialog.jsx';
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

    // Which pages link to which (for page status badges + "what links here").
    const linkSources = useMemo(() => buildLinkSources(view.layout, view.nav), [view.layout, view.nav]);

    const setField = useCallback((path, value) => {
        setDraft(d => {
            const n = structuredClone(d);
            let cur = n;
            path.slice(0, -1).forEach(k => cur = cur[k]);
            cur[path.at(-1)] = value;
            return n;
        });
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
    async function addPage() {
        const name = await promptDialog('New page name (use a slash for sections, e.g. menu/pizza)');
        if (!name || !name.trim()) return;
        const path = slugifyPath(name);
        if (path === '/') return;
        const nav = draft.nav || [];
        if (nav.some(n => n.path === path)) {
            notify('A page with that address already exists.', 'error');
            return;
        }
        // The nav label defaults to the last path segment (so /menu/pizza shows "pizza").
        // New pages start unlinked (not in the nav menu) until explicitly added.
        setField(['nav'], [...nav, {label: lastSegment(path), path, hidden: true}]);
        setField(['layout', path], {columns: 1, blocks: []});
        navigate(path);
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
        // Move the layout to the new key and repoint any links that pointed at the old path.
        const layout = {};
        Object.entries(draft.layout || {}).forEach(([rk, pg]) => {
            const key = rk === oldPath ? np : rk;
            const blocks = (pg?.blocks || []).map(b =>
                (b.props && b.props.to === oldPath) ? {...b, props: {...b.props, to: np}} : b);
            layout[key] = {...pg, blocks};
        });
        setField(['layout'], layout);
        setField(['nav'], nav.map(n => {
            if (n.path !== oldPath) return n;
            const wasPathLabel = !n.label || n.label === lastSegment(oldPath);
            return {...n, path: np, label: wasPathLabel ? lastSegment(np) : n.label};
        }));
        if (route === oldPath) navigate(np);
    }

    async function deletePage(path) {
        if (path === '/') return;
        setField(['nav'], (draft.nav || []).filter(n => n.path !== path));
        const nextLayout = unlinkLayoutTarget(draft.layout || {}, path);
        delete nextLayout[path];
        setField(['layout'], nextLayout);
        if (route === path) navigate('/');
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
        const copy = {
            columns: tpl.columns || 1, templateName: name,
            blocks: (tpl.blocks || []).map(b => ({...b, id: newId(), props: {...b.props}}))
        };
        setField(['layout', route], copy);
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

    return <EditProvider editing={live} setField={setField}>
        <main className={`${isAdmin ? 'admin-chrome ' : ''}${live ? 'is-editing' : ''}`.trim() || undefined}>
            <SiteHeader settings={view}/>
            <BuilderPage route={route} settings={view} featured={featured} items={gallery} onImageOpen={setModalImage}/>
            <SiteFooter settings={view} items={gallery} onImageOpen={setModalImage}/>
            <ImageModal image={modalImage} onClose={() => setModalImage(null)}/>
            {isAdmin &&
                <AdminBar editing={editing} preview={preview} saveState={saveState} adminPath={adminPath}
                          currentPage={pageLabel((view.nav || []).find(n => n.path === route)) || route}
                          linkSources={linkSources}
                          onEnter={() => setEditing(true)} onSave={save} onDiscard={discard} onAddPage={addPage}
                          onDeletePage={deletePage}
                          onTogglePreview={() => setPreview(p => !p)}
                          pagesProps={{
                              pages: view.nav, route, templates: view.layouts,
                              currentTemplate: view.layout?.[route]?.templateName,
                              onAddPage: addPage, onToggleNav: toggleNav,
                              onToggleCta: toggleCta, onRename: renamePage, onChangePath: changePath, onMove: moveNav,
                              onSaveTemplate: saveTemplate, onApplyTemplate: applyTemplate,
                              onUpdateTemplate: updateTemplate, onDeleteTemplate: deleteTemplate
                          }}
                          themeProps={{
                              theme: view.theme, themes: view.themes, setField,
                              onSavePreset: saveThemePreset, onDeletePreset: deleteThemePreset
                          }}/>}
        </main>
    </EditProvider>;
}
