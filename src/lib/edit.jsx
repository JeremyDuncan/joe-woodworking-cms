import React, {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {FileText, Globe, Link2} from 'lucide-react';
import {navigate} from './navigation.jsx';
import {promptDialog} from './dialog.jsx';
import {PagePicker} from '../components/PagePicker.jsx';
import {pageLabel} from './pages.js';

const EditContext = createContext({editing: false, setField: () => {}, reload: () => {}});

export const useEdit = () => useContext(EditContext);

export function EditProvider({editing, setField, reload, children}) {
    return <EditContext.Provider value={{editing, setField, reload}}>{children}</EditContext.Provider>;
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

// Plain-text content of a rich-text HTML string (tags stripped). Used where rich HTML
// can't be rendered, e.g. a whole list item that is itself a link.
export function htmlToText(html) {
    if (html == null) return '';
    if (typeof document === 'undefined') return String(html).replace(/<[^>]*>/g, '');
    const el = document.createElement('div');
    el.innerHTML = html;
    return el.textContent || '';
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
    const [picker, setPicker] = useState(null);

    useEffect(() => {
        const el = ref.current;
        const incoming = html != null ? html : escapeHtml(text ?? '');
        if (el && document.activeElement !== el && el.innerHTML !== incoming) el.innerHTML = incoming;
    });

    function emit() {
        onChange(ref.current.innerHTML);
    }

    // The <a> ancestor of a node, within this editor (or null).
    function anchorAt(node) {
        let n = node;
        while (n && n !== ref.current) {
            if (n.nodeType === 1 && n.tagName === 'A') return n;
            n = n.parentNode;
        }
        return null;
    }

    function refreshBar() {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || !ref.current?.contains(sel.anchorNode)) {
            setBar(null);
            return;
        }
        const anchor = anchorAt(sel.anchorNode);
        // Show the bar for a text selection (to create a link) OR when the caret sits
        // inside an existing link (to see / change / remove where it points).
        if (sel.isCollapsed && !anchor) {
            setBar(null);
            return;
        }
        savedRange.current = sel.getRangeAt(0).cloneRange();
        const rectFrom = (sel.isCollapsed && anchor) ? anchor : sel.getRangeAt(0);
        const r = rectFrom.getBoundingClientRect();
        setBar({
            top: r.top + window.scrollY - 46,
            left: r.left + window.scrollX,
            anchor: anchor || null,
            href: anchor ? (anchor.getAttribute('href') || '') : null
        });
    }

    // Reselect the right text before running execCommand: the whole link when editing
    // an existing one, otherwise the saved selection (a dialog can steal focus).
    function reselect(anchor) {
        ref.current.focus();
        const sel = window.getSelection();
        sel.removeAllRanges();
        if (anchor) {
            const range = document.createRange();
            range.selectNodeContents(anchor);
            sel.addRange(range);
        } else if (savedRange.current) {
            sel.addRange(savedRange.current);
        }
    }

    function applyLink(to, target = bar) {
        if (!to) return;
        reselect(target?.anchor);
        document.execCommand('createLink', false, to);
        emit();
        setBar(null);
        setPicker(null);
    }

    async function applyExternal(target = bar) {
        const anchor = target?.anchor, current = target?.href;
        const url = await promptDialog('External link (opens in a new tab):',
            current && /^https?:\/\//.test(current) ? current : 'https://');
        if (!url || !url.trim()) return;
        reselect(anchor);
        document.execCommand('createLink', false, url.trim());
        emit();
        setBar(null);
        setPicker(null);
    }

    function unlink() {
        reselect(bar?.anchor);
        document.execCommand('unlink');
        emit();
        setBar(null);
    }

    function linkLabel(href) {
        const p = (pages || []).find(x => x.path === href);
        return p ? pageLabel(p) : href;
    }

    function openPagePicker() {
        setPicker({anchor: bar?.anchor || null, href: bar?.href || ''});
        setBar(null);
    }

    const Tag = as;
    return <>
        <Tag ref={ref} className={`inline-edit ${className}`.trim()} contentEditable suppressContentEditableWarning
             spellCheck={false} data-placeholder={placeholder}
             onInput={emit} onMouseUp={refreshBar} onKeyUp={refreshBar}
             onBlur={() => setTimeout(() => setBar(null), 200)}/>
        {bar && createPortal(
            // preventDefault on mousedown keeps the selection/caret (and focus) alive,
            // so execCommand acts on the right text.
            <div className="rich-linkbar" style={{top: bar.top, left: bar.left}}
                 onMouseDown={e => e.preventDefault()}>
                {bar.href != null
                    ? <span className="rich-linkbar-current" title={bar.href}>
                        <Link2 size={13}/> Linked to <strong>{linkLabel(bar.href) || '(empty)'}</strong></span>
                    : <span className="rich-linkbar-label">Link to:</span>}
                <button type="button" className="rich-page-link" onClick={openPagePicker}>
                    <FileText size={14}/> Page
                </button>
                <button type="button"
                        className={`rich-external${bar.href && /^https?:\/\//.test(bar.href) ? ' is-active' : ''}`}
                        onClick={() => applyExternal(bar)}><Globe size={14}/> External</button>
                {bar.href != null &&
                    <button type="button" className="rich-unlink" onClick={unlink}>Remove link</button>}
            </div>, document.body)}
        {picker && <PagePicker pages={pages} current={picker.href} title="Link selected text to a page"
                               onPick={path => applyLink(path, picker)}
                               onExternal={() => applyExternal(picker)}
                               onClose={() => setPicker(null)}/>}
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
