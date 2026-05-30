import React, {createContext, useContext, useEffect, useRef} from 'react';

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

// Renders a single settings field: plain text normally, editable in edit mode.
export function Edit({path, value, as = 'span', className = '', placeholder = ''}) {
    const {editing, setField} = useEdit();
    const Tag = as;
    if (!editing) return <Tag className={className || undefined}>{value}</Tag>;
    return <InlineText as={as} className={className} value={value} placeholder={placeholder}
                       onChange={v => setField(path, v)}/>;
}
