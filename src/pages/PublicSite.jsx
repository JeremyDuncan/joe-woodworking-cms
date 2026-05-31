import React, {useCallback, useEffect, useState} from 'react';
import {fallbackGallery} from '../data/defaults.js';
import {SiteHeader} from '../components/SiteHeader.jsx';
import {ImageModal} from '../components/ImageModal.jsx';
import {EditBar} from '../components/EditBar.jsx';
import {ThemePanel} from '../components/ThemePanel.jsx';
import {EditProvider} from '../lib/edit.jsx';
import {applyTheme} from '../lib/theme.js';
import {HomePage} from './HomePage.jsx';
import {WorkPage} from './WorkPage.jsx';
import {OptionsPage} from './OptionsPage.jsx';
import {ProcessPage} from './ProcessPage.jsx';
import {ContactPage} from './ContactPage.jsx';

export function PublicSite({works, settings, route, isAdmin, adminPath, reloadSettings}) {
    const [modalImage, setModalImage] = useState(null);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(settings);
    const [saveState, setSaveState] = useState(null);
    const [themeOpen, setThemeOpen] = useState(false);

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

    // Persist a named theme preset immediately (merges only `themes` on the server,
    // so it doesn't commit other in-progress page edits).
    async function saveThemePreset(name) {
        const themeCopy = JSON.parse(JSON.stringify(draft.theme || {}));
        setField(['themes', name], themeCopy);
        const nextThemes = {...(draft.themes || {}), [name]: themeCopy};
        await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({themes: nextThemes})
        });
        await reloadSettings();
    }

    const gallery = works ?? fallbackGallery;
    const featured = gallery.find(w => w.featured) || gallery.find(w => w.media?.length) || gallery[0];

    let page = <HomePage settings={view} featured={featured} onImageOpen={setModalImage}/>;
    if (route === '/work') page = <WorkPage settings={view} gallery={gallery} onImageOpen={setModalImage}/>;
    if (route === '/options') page = <OptionsPage settings={view} featured={featured} onImageOpen={setModalImage}/>;
    if (route === '/process') page = <ProcessPage settings={view}/>;
    if (route === '/contact') page = <ContactPage settings={view}/>;

    return <EditProvider editing={editing} setField={setField}>
        <main className={editing ? 'is-editing' : undefined}>
            <SiteHeader settings={view}/>
            {page}
            <ImageModal image={modalImage} onClose={() => setModalImage(null)}/>
            {isAdmin && <EditBar editing={editing} saveState={saveState} adminPath={adminPath} pages={view.nav}
                                 onEnter={() => setEditing(true)} onSave={save} onDiscard={discard}
                                 onTheme={() => setThemeOpen(o => !o)}/>}
            {isAdmin && editing && themeOpen &&
                <ThemePanel theme={view.theme} themes={view.themes} setField={setField}
                            onSavePreset={saveThemePreset} onClose={() => setThemeOpen(false)}/>}
        </main>
    </EditProvider>;
}
