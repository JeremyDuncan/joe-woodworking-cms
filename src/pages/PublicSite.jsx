import React, {useCallback, useEffect, useState} from 'react';
import {fallbackGallery} from '../data/defaults.js';
import {SiteHeader} from '../components/SiteHeader.jsx';
import {ImageModal} from '../components/ImageModal.jsx';
import {EditBar} from '../components/EditBar.jsx';
import {EditProvider} from '../lib/edit.jsx';
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

    // Keep the draft in sync with saved settings while not actively editing.
    useEffect(() => {
        if (!editing) setDraft(settings);
    }, [settings, editing]);

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

    const view = editing ? draft : settings;
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
                                 onEnter={() => setEditing(true)} onSave={save} onDiscard={discard}/>}
        </main>
    </EditProvider>;
}
