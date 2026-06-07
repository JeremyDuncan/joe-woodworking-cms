import React, {useRef, useState} from 'react';
import {Archive, Download, ShieldAlert, Upload} from 'lucide-react';
import {confirmDialog, notify} from '../lib/dialog.jsx';
import {SectionHeader} from './SectionHeader.jsx';

// Download a full site backup (settings + items + every image) as one zip, and
// restore the whole site from such a zip.
export function BackupPanel({reload}) {
    const fileRef = useRef(null);
    const [busy, setBusy] = useState(false);

    async function onRestoreFile(e) {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const ok = await confirmDialog(
            'Restoring will OVERWRITE all current pages, themes, page templates, items, images, and admin logins with the contents of this backup. This cannot be undone. Continue?',
            {danger: true, okLabel: 'Restore & overwrite'});
        if (!ok) return;
        setBusy(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const r = await fetch('/api/admin/restore', {method: 'POST', body: fd});
            const j = await r.json().catch(() => ({}));
            if (!r.ok) {
                notify(j.error || 'Restore failed.', 'error');
                return;
            }
            notify(`Restored ${j.restored?.items ?? 0} items, ${j.restored?.media ?? 0} images, and ${j.restored?.users ?? 0} logins. Reloading…`, 'success');
            if (reload) await reload();
            setTimeout(() => location.reload(), 1400);
        } catch {
            notify('Network error during restore.', 'error');
        } finally {
            setBusy(false);
        }
    }

    return <section className="backup-panel">
        <SectionHeader icon={Archive} title="Backup & Restore">
            Download a single <code>.zip</code> with every page, page template, saved theme, saved item, uploaded
            image, and admin login. Keep it somewhere safe — you can rebuild the whole site from it later, even onto
            brand-new, empty storage.
        </SectionHeader>

        <div className="backup-actions">
            <a className="button button-primary" href="/api/admin/backup" download>
                <Download size={17}/> Download backup
            </a>
            <button type="button" className="button button-ghost" disabled={busy}
                    onClick={() => fileRef.current?.click()}>
                <Upload size={17}/> {busy ? 'Restoring…' : 'Restore from backup'}
            </button>
            <input ref={fileRef} type="file" accept=".zip,application/zip" hidden onChange={onRestoreFile}/>
        </div>

        <p className="backup-warning">
            <ShieldAlert size={16}/> Restoring replaces everything currently saved. If you’re unsure, download a fresh
            backup first.
        </p>
    </section>;
}
