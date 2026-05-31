import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';

// Imperative, promise-based replacements for window.alert/confirm/prompt so call
// sites barely change: notify(msg) / await confirmDialog(msg) / await promptDialog(msg).
let pushToast = null;
let openDialog = null;
let counter = 0;

export function notify(text, type = 'info') {
    const id = ++counter;
    if (!pushToast) return;
    pushToast({id, text, type});
    setTimeout(() => pushToast && pushToast({id, remove: true}), 3600);
}

export function confirmDialog(text, opts = {}) {
    return new Promise(resolve => {
        if (openDialog) openDialog({kind: 'confirm', text, ...opts, resolve});
        else resolve(false);
    });
}

export function promptDialog(text, defaultValue = '') {
    return new Promise(resolve => {
        if (openDialog) openDialog({kind: 'prompt', text, value: defaultValue, resolve});
        else resolve(null);
    });
}

export function DialogHost() {
    const [toasts, setToasts] = useState([]);
    const [dialog, setDialog] = useState(null);
    const [input, setInput] = useState('');

    useEffect(() => {
        pushToast = t => {
            if (t.remove) setToasts(list => list.filter(x => x.id !== t.id));
            else setToasts(list => [...list, t]);
        };
        openDialog = d => {
            setInput(d.kind === 'prompt' ? (d.value || '') : '');
            setDialog(d);
        };
        return () => {
            pushToast = null;
            openDialog = null;
        };
    }, []);

    function finish(result) {
        if (dialog) dialog.resolve(result);
        setDialog(null);
    }

    const cancelResult = dialog && dialog.kind === 'prompt' ? null : false;

    return createPortal(<>
        <div className="toast-stack">
            {toasts.map(t => <div key={t.id} className={`toast toast-${t.type || 'info'}`}>{t.text}</div>)}
        </div>
        {dialog && <div className="dialog-backdrop" onMouseDown={() => finish(cancelResult)}>
            <div className="dialog" onMouseDown={e => e.stopPropagation()}>
                <p className="dialog-text">{dialog.text}</p>
                {dialog.kind === 'prompt' &&
                    <input className="dialog-input" autoFocus value={input}
                           onChange={e => setInput(e.target.value)}
                           onKeyDown={e => {
                               if (e.key === 'Enter') finish(input);
                               if (e.key === 'Escape') finish(null);
                           }}/>}
                <div className="dialog-actions">
                    <button type="button" className="button button-ghost"
                            onClick={() => finish(cancelResult)}>{dialog.cancelLabel || 'Cancel'}</button>
                    <button type="button" className={`button ${dialog.danger ? 'danger' : 'button-primary'}`}
                            onClick={() => finish(dialog.kind === 'prompt' ? input : true)}>
                        {dialog.okLabel || 'OK'}</button>
                </div>
            </div>
        </div>}
    </>, document.body);
}
