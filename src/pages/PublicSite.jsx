import React, {useCallback, useEffect, useState} from 'react';
import {fallbackGallery} from '../data/defaults.js';
import {SiteHeader} from '../components/SiteHeader.jsx';
import {ImageModal} from '../components/ImageModal.jsx';
import {EditBar} from '../components/EditBar.jsx';
import {ThemePanel} from '../components/ThemePanel.jsx';
import {PagesPanel} from '../components/PagesPanel.jsx';
import {EditProvider} from '../lib/edit.jsx';
import {applyTheme} from '../lib/theme.js';
import {navigate} from '../lib/navigation.jsx';
import {BuilderPage} from './BuilderPage.jsx';

function newId() {
    return `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function PublicSite({works, settings, route, isAdmin, adminPath, reloadSettings}) {
    const [modalImage, setModalImage] = useState(null);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(settings);
    const [saveState, setSaveState] = useState(null);
    const [themeOpen, setThemeOpen] = useState(false);
    const [pagesOpen, setPagesOpen] = useState(false);

    // Keep the draft in sync with saved settings while not actively editing.
    useEffect(() => {
        if (!editing) setDraft(settings);
    }, [settings, editing]);

    // Apply the active theme (draft while editing, saved otherwise) live via CSS vars.
    const view = editing ? draft : settings;
    useEffect(() => {
        applyTheme(view.theme);
    }, [view.theme]);

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
        const workNeedsImage = Object.values(draft.layout || {}).some(pg =>
            (pg?.blocks || []).some(b => b.type === 'work' && !(b.props && b.props.image)));
        if (workNeedsImage) {
            alert('Each Work item needs a picture before the page can be saved.');
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
            setEditing(false);
            setSaveState(null);
        } catch {
            setSaveState('error');
        }
    }

    function discard() {
        setDraft(settings);
        setEditing(false);
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

    // ---- Page management ----
    function addPage() {
        const name = prompt('New page name:');
        if (!name || !name.trim()) return;
        const label = name.trim();
        const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const path = '/' + slug;
        if (!slug) return;
        const nav = draft.nav || [];
        if (nav.some(n => n.path === path)) {
            alert('A page with that address already exists.');
            return;
        }
        const inNav = confirm('Show this page in the top navigation menu?\n\nOK = show in menu\nCancel = hidden (you can still link to it from buttons)');
        setField(['nav'], [...nav, {label, path, hidden: !inNav}]);
        setField(['layout', path], {columns: 1, blocks: []});
        setPagesOpen(false);
        navigate(path);
    }

    function toggleNav(path) {
        if (path === '/') return;
        setField(['nav'], (draft.nav || []).map(n => n.path === path ? {...n, hidden: !n.hidden} : n));
    }

    function toggleCta(path) {
        setField(['nav'], (draft.nav || []).map(n => n.path === path ? {...n, cta: !n.cta} : n));
    }

    function deletePage(path) {
        if (path === '/') return;
        if (!confirm('Delete this page? (Applies when you Save.)')) return;
        setField(['nav'], (draft.nav || []).filter(n => n.path !== path));
        const nextLayout = {...(draft.layout || {})};
        delete nextLayout[path];
        setField(['layout'], nextLayout);
        if (route === path) navigate('/');
    }

    // ---- Layout templates ----
    async function saveTemplate(name) {
        const cur = draft.layout?.[route];
        if (!cur) return;
        const copy = JSON.parse(JSON.stringify(cur));
        setField(['layouts', name], copy);
        await persistKey('layouts', {...(draft.layouts || {}), [name]: copy});
    }

    function applyTemplate(name) {
        const tpl = (draft.layouts || {})[name];
        if (!tpl) return;
        const copy = {
            columns: tpl.columns || 1,
            blocks: (tpl.blocks || []).map(b => ({...b, id: newId(), props: {...b.props}}))
        };
        setField(['layout', route], copy);
    }

    const gallery = works ?? fallbackGallery;
    const featured = gallery.find(w => w.featured) || gallery.find(w => w.media?.length) || gallery[0];

    return <EditProvider editing={editing} setField={setField}>
        <main className={editing ? 'is-editing' : undefined}>
            <SiteHeader settings={view}/>
            <BuilderPage route={route} settings={view} featured={featured} works={gallery}
                         onImageOpen={setModalImage}/>
            <ImageModal image={modalImage} onClose={() => setModalImage(null)}/>
            {isAdmin && <EditBar editing={editing} saveState={saveState} adminPath={adminPath}
                                 pages={(view.nav || []).filter(n => !n.hidden)}
                                 onEnter={() => setEditing(true)} onSave={save} onDiscard={discard}
                                 onTheme={() => setThemeOpen(o => !o)} onPages={() => setPagesOpen(o => !o)}/>}
            {isAdmin && editing && themeOpen &&
                <ThemePanel theme={view.theme} themes={view.themes} setField={setField}
                            onSavePreset={saveThemePreset} onClose={() => setThemeOpen(false)}/>}
            {isAdmin && editing && pagesOpen &&
                <PagesPanel pages={view.nav} route={route} templates={view.layouts}
                            onAddPage={addPage} onDeletePage={deletePage} onToggleNav={toggleNav}
                            onToggleCta={toggleCta} onSaveTemplate={saveTemplate} onApplyTemplate={applyTemplate}
                            onClose={() => setPagesOpen(false)}/>}
        </main>
    </EditProvider>;
}
