import React from 'react';
import {Link} from '../lib/navigation.jsx';
import {MediaPreview} from '../components/MediaPreview.jsx';
import {InlineText} from '../lib/edit.jsx';
import {DynamicIcon} from '../lib/icons.jsx';
import {IconControl} from '../components/IconPicker.jsx';

function Eyebrow({block, setProp, editing}) {
    return <p className="eyebrow"><DynamicIcon className="ui-icon" name={block.props.icon || 'Star'} size={15}/> {editing
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
    const icon = block.props.icon ? <DynamicIcon className="ui-icon" name={block.props.icon} size={18}/> : null;
    if (!editing) return <Link to={block.props.to || '/'} className={cls}>{block.props.label}{icon}</Link>;
    return <span className={cls}><InlineText value={block.props.label} placeholder="Button text"
                                             onChange={v => setProp('label', v)}/>{icon}</span>;
}

function ListBlock({block, setProp, editing}) {
    const items = block.props.items || [];
    const bullet = block.props.icon || 'BadgeCheck';
    return <div className="proof-strip">
        {items.map((it, i) => <span key={i}><DynamicIcon className="ui-icon" name={bullet} size={16}/>
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

function buttonControls({block, setProp, pages}) {
    const opts = pages || [];
    const known = opts.some(p => p.path === block.props.to);
    return <>
        <label className="block-ctl">Style
            <select value={block.props.variant || 'primary'} onChange={e => setProp('variant', e.target.value)}>
                <option value="primary">Primary</option>
                <option value="ghost">Ghost</option>
            </select>
        </label>
        <label className="block-ctl">Links to
            <select value={block.props.to || ''} onChange={e => setProp('to', e.target.value)}>
                {!known && <option value={block.props.to || ''}>{block.props.to || 'Select page'}</option>}
                {opts.map(p => <option key={p.path} value={p.path}>{p.label}</option>)}
            </select>
        </label>
        <IconControl label="Icon" value={block.props.icon} fallback="ArrowRight" allowNone
                     onChange={v => setProp('icon', v)}/>
    </>;
}

function eyebrowControls({block, setProp}) {
    return <IconControl label="Icon" value={block.props.icon} fallback="Star"
                        onChange={v => setProp('icon', v)}/>;
}

function listControls({block, setProp}) {
    return <IconControl label="Bullet" value={block.props.icon} fallback="BadgeCheck"
                        onChange={v => setProp('icon', v)}/>;
}

// Each block type is self-contained: it carries its own content in `props`, so a
// page can hold any number of them. `defaults` seeds a freshly-added block.
export const blockRegistry = {
    eyebrow: {label: 'Eyebrow', defaults: {text: 'Eyebrow', icon: 'Star'}, render: Eyebrow, controls: eyebrowControls},
    heading: {label: 'Heading', defaults: {text: 'Heading', level: 2}, render: Heading, controls: headingControls},
    text: {label: 'Paragraph', defaults: {text: 'Paragraph text.'}, render: Text},
    button: {label: 'Button', defaults: {label: 'Button', to: '/contact', variant: 'primary'}, render: ButtonBlock, controls: buttonControls},
    list: {label: 'List', defaults: {items: ['Item one', 'Item two'], icon: 'BadgeCheck'}, render: ListBlock, controls: listControls},
    image: {label: 'Featured image', defaults: {source: 'featured'}, render: ImageBlock},
};
