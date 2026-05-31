import React, {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {navigate} from './navigation.jsx';
import {promptDialog} from './dialog.jsx';

const EditContext = createContext({editing: false, setField: () => {}});

export const useEdit = () => useContext(EditContext);

export function EditProvider({editing, setField, children}) {
    return <EditContext.Provider value={{editing, setField}}>{children}</EditContext.Provider>;
}

// A contentEditable element that won't fight React over the cursor: it only writes
// the incoming value into the DOM when the element isn't focused, so typing is never
// interrupted by re-renders driven by the value it just emitted.
export function InlineText({value, onChange, as = 'span', className = '', placeholder = ''}) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (el && document.activeElement !== el && el.textContent !== (value ?? '')) {
            el.textContent = value ?? '';
        }
    });
    const Tag = as;
    return <Tag
        ref={ref}
        className={`inline-edit ${className}`.trim()}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        data-placeholder={placeholder}
        onInput={e => onChange(e.currentTarget.textContent)}
    />;
}

function escapeHtml(s = '') {
    return s.replace(/[&<>]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[c]));
}

// Whitelist sanitiser for the small set of inline markup our rich editor can produce
// (links + basic emphasis). Anything else is unwrapped/stripped. Runs in the browser.
const ALLOWED_TAGS = {A: ['href'], B: [], STRONG: [], I: [], EM: [], U: [], BR: [], SPAN: [], DIV: [], P: []};

export function sanitizeHtml(html) {
    if (typeof window === 'undefined' || !html) return html || '';
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    const root = doc.body.firstChild;
    const walk = node => {
        [...node.childNodes].forEach(child => {
            if (child.nodeType === 3) return;            // text node
            if (child.nodeType !== 1) {                  // comment / other → drop
                child.remove();
                return;
            }
            const tag = child.tagName;
            if (!ALLOWED_TAGS[tag]) {                     // disallowed → unwrap, keep text
                const parent = child.parentNode;
                while (child.firstChild) parent.insertBefore(child.firstChild, child);
                parent.removeChild(child);
                return;
            }
            [...child.attributes].forEach(a => {
                if (!ALLOWED_TAGS[tag].includes(a.name)) child.removeAttribute(a.name);
            });
            if (tag === 'A') {
                const href = child.getAttribute('href') || '';
                const ok = /^(\/|https?:\/\/|mailto:|tel:)/.test(href);
                if (!ok) child.removeAttribute('href');
                child.setAttribute('class', 'text-link');
                if (/^https?:\/\//.test(href)) {
                    child.setAttribute('target', '_blank');
                    child.setAttribute('rel', 'noopener noreferrer');
                }
            }
            walk(child);
        });
    };
    walk(root);
    return root.innerHTML;
}

// Renders sanitised rich HTML, intercepting clicks on internal (/path) links so they
// use client-side navigation instead of a full page load.
export function RichHtml({as = 'span', className = '', html}) {
    const Tag = as;
    const safe = useMemo(() => sanitizeHtml(html), [html]);

    function onClick(e) {
        const a = e.target.closest?.('a');
        if (!a) return;
        const href = a.getAttribute('href') || '';
        if (href.startsWith('/')) {
            e.preventDefault();
            navigate(href);
        }
    }

    return <Tag className={`rich-text ${className}`.trim()} onClick={onClick}
                dangerouslySetInnerHTML={{__html: safe}}/>;
}

// A contentEditable rich editor: select text and a floating bar lets you link it to a
// page (or unlink). Stores HTML via onChange. Like InlineText, it only writes incoming
// content into the DOM while unfocused, so the cursor is never disturbed.
export function RichText({as = 'span', className = '', html, text, placeholder = '', pages = [], onChange}) {
    const ref = useRef(null);
    const savedRange = useRef(null);
    const [bar, setBar] = useState(null);

    useEffect(() => {
        const el = ref.current;
        const incoming = html != null ? html : escapeHtml(text ?? '');
        if (el && document.activeElement !== el && el.innerHTML !== incoming) el.innerHTML = incoming;
    });

    function emit() {
        onChange(ref.current.innerHTML);
    }

    function refreshBar() {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount || !ref.current?.contains(sel.anchorNode)) {
            setBar(null);
            return;
        }
        savedRange.current = sel.getRangeAt(0).cloneRange();
        const r = sel.getRangeAt(0).getBoundingClientRect();
        setBar({top: r.top + window.scrollY - 46, left: r.left + window.scrollX});
    }

    function applyLink(to) {
        if (!to) return;
        document.execCommand('createLink', false, to);
        emit();
        setBar(null);
    }

    // Opening a dialog moves focus out of the editor, collapsing the selection — so
    // re-select the saved range before wrapping it in the link.
    async function applyExternal() {
        const url = await promptDialog('External link (opens in a new tab):', 'https://');
        if (!url || !url.trim()) return;
        const el = ref.current;
        el.focus();
        if (savedRange.current) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange.current);
        }
        document.execCommand('createLink', false, url.trim());
        emit();
        setBar(null);
    }

    function unlink() {
        document.execCommand('unlink');
        emit();
        setBar(null);
    }

    const Tag = as;
    return <>
        <Tag ref={ref} className={`inline-edit ${className}`.trim()} contentEditable suppressContentEditableWarning
             spellCheck={false} data-placeholder={placeholder}
             onInput={emit} onMouseUp={refreshBar} onKeyUp={refreshBar}
             onBlur={() => setTimeout(() => setBar(null), 200)}/>
        {bar && createPortal(
            // preventDefault on mousedown keeps the text selection (and focus) alive,
            // so execCommand acts on the still-selected text.
            <div className="rich-linkbar" style={{top: bar.top, left: bar.left}}
                 onMouseDown={e => e.preventDefault()}>
                <span className="rich-linkbar-label">Link to:</span>
                {pages.map(p => <button key={p.path} type="button"
                                        onClick={() => applyLink(p.path)}>{p.label}</button>)}
                <button type="button" className="rich-external" onClick={applyExternal}>External…</button>
                <button type="button" className="rich-unlink" onClick={unlink}>Unlink</button>
            </div>, document.body)}
    </>;
}

// Renders a single settings field: plain text normally, editable in edit mode.
export function Edit({path, value, as = 'span', className = '', placeholder = ''}) {
    const {editing, setField} = useEdit();
    const Tag = as;
    if (!editing) return <Tag className={className || undefined}>{value}</Tag>;
    return <InlineText as={as} className={className} value={value} placeholder={placeholder}
                       onChange={v => setField(path, v)}/>;
}
