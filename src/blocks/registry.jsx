import React from 'react';
import {BadgeCheck, Star} from 'lucide-react';
import {Link} from '../lib/navigation.jsx';
import {MediaPreview} from '../components/MediaPreview.jsx';
import {InlineText} from '../lib/edit.jsx';

function Eyebrow({block, setProp, editing}) {
    return <p className="eyebrow"><Star size={15} fill="currentColor"/> {editing
        ? <InlineText value={block.props.text} placeholder="Eyebrow" onChange={v => setProp('text', v)}/>
        : block.props.text}</p>;
}

function Heading({block, setProp, editing}) {
    const Tag = `h${block.props.level || 2}`;
    if (!editing) return <Tag>{block.props.text}</Tag>;
    return <InlineText as={Tag} value={block.props.text} placeholder="Heading" onChange={v => setProp('text', v)}/>;
}

function Text({block, setProp, editing}) {
    if (!editing) return <p>{block.props.text}</p>;
    return <InlineText as="p" value={block.props.text} placeholder="Paragraph" onChange={v => setProp('text', v)}/>;
}

function ButtonBlock({block, setProp, editing}) {
    const cls = `button button-${block.props.variant === 'ghost' ? 'ghost' : 'primary'}`;
    if (!editing) return <Link to={block.props.to || '/'} className={cls}>{block.props.label}</Link>;
    return <span className={cls}><InlineText value={block.props.label} placeholder="Button text"
                                             onChange={v => setProp('label', v)}/></span>;
}

function ListBlock({block, setProp, editing}) {
    const items = block.props.items || [];
    return <div className="proof-strip">
        {items.map((it, i) => <span key={i}><BadgeCheck size={16}/>
            {editing
                ? <InlineText value={it} placeholder="Item"
                              onChange={v => setProp('items', items.map((x, j) => j === i ? v : x))}/>
                : it}
            {editing && <button type="button" className="chip-remove" title="Remove"
                                onClick={() => setProp('items', items.filter((_, j) => j !== i))}>×</button>}
        </span>)}
        {editing && <button type="button" className="chip-add"
                            onClick={() => setProp('items', [...items, 'New item'])}>+ Add</button>}
    </div>;
}

function ImageBlock({featured, onImageOpen}) {
    return <div className="home-visual"><MediaPreview media={featured?.media} onImageOpen={onImageOpen}/></div>;
}

function headingControls({block, setProp}) {
    return <label className="block-ctl">Size
        <select value={block.props.level || 2} onChange={e => setProp('level', Number(e.target.value))}>
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
        </select>
    </label>;
}

function buttonControls({block, setProp}) {
    return <>
        <label className="block-ctl">Style
            <select value={block.props.variant || 'primary'} onChange={e => setProp('variant', e.target.value)}>
                <option value="primary">Primary</option>
                <option value="ghost">Ghost</option>
            </select>
        </label>
        <label className="block-ctl">Link
            <input value={block.props.to || ''} placeholder="/contact"
                   onChange={e => setProp('to', e.target.value)}/>
        </label>
    </>;
}

// Each block type is self-contained: it carries its own content in `props`, so a
// page can hold any number of them. `defaults` seeds a freshly-added block.
export const blockRegistry = {
    eyebrow: {label: 'Eyebrow', defaults: {text: 'Eyebrow'}, render: Eyebrow},
    heading: {label: 'Heading', defaults: {text: 'Heading', level: 2}, render: Heading, controls: headingControls},
    text: {label: 'Paragraph', defaults: {text: 'Paragraph text.'}, render: Text},
    button: {label: 'Button', defaults: {label: 'Button', to: '/contact', variant: 'primary'}, render: ButtonBlock, controls: buttonControls},
    list: {label: 'List', defaults: {items: ['Item one', 'Item two']}, render: ListBlock},
    image: {label: 'Featured image', defaults: {source: 'featured'}, render: ImageBlock},
};
