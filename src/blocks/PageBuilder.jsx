import React, {useRef, useState} from 'react';
import {Plus} from 'lucide-react';
import {useEdit} from '../lib/edit.jsx';
import {BlockFrame} from './BlockFrame.jsx';

// Renders a page from a { columns, blocks:[{id,type,column,props}] } layout.
// Blocks are grouped into columns; array order sets vertical order within a column.
// In edit mode blocks are drag-reorderable (drop on a block to place before it,
// drop on empty column space to append to that column).
export function PageBuilder({route, layout, registry, featured, onImageOpen, pages}) {
    const {editing, setField} = useEdit();
    const columns = Math.min(3, Math.max(1, layout.columns || 1));
    const blocks = layout.blocks || [];
    const setLayout = patch => setField(['layout', route], {...layout, ...patch});
    const setBlocks = next => setLayout({blocks: next});
    const colOf = b => Math.min(columns - 1, Math.max(0, b.column || 0));

    const dragId = useRef(null);
    const [overId, setOverId] = useState(null);

    const setProp = (idx, key, value) => setBlocks(blocks.map((b, i) =>
        i === idx ? {...b, props: {...b.props, [key]: value}} : b));

    function addBlock(type, column) {
        const def = registry[type];
        const block = {
            id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type, column, props: {...def.defaults}
        };
        setBlocks([...blocks, block]);
    }

    function removeBlock(idx) {
        setBlocks(blocks.filter((_, i) => i !== idx));
    }

    function moveBefore(fromId, targetId) {
        if (!fromId || fromId === targetId) return;
        const arr = blocks.slice();
        const fromI = arr.findIndex(b => b.id === fromId);
        if (fromI < 0) return;
        const [moved] = arr.splice(fromI, 1);
        const ti = arr.findIndex(b => b.id === targetId);
        if (ti < 0) arr.push(moved);
        else arr.splice(ti, 0, {...moved, column: arr[ti].column});
        setBlocks(arr);
    }

    function moveToColumn(fromId, col) {
        if (!fromId) return;
        const arr = blocks.slice();
        const fromI = arr.findIndex(b => b.id === fromId);
        if (fromI < 0) return;
        const [moved] = arr.splice(fromI, 1);
        arr.push({...moved, column: col});
        setBlocks(arr);
    }

    const columnBlocks = Array.from({length: columns}, (_, c) =>
        blocks.map((b, i) => ({b, i})).filter(o => colOf(o.b) === c));

    function renderBlock(b, i) {
        const def = registry[b.type];
        const Comp = def?.render;
        const content = Comp ? <Comp block={b} setProp={(k, v) => setProp(i, k, v)} editing={editing}
                                     featured={featured} onImageOpen={onImageOpen}/> : null;
        if (!editing) return <React.Fragment key={b.id}>{content}</React.Fragment>;
        return <BlockFrame key={b.id} label={def?.label || b.type} isOver={overId === b.id}
                           onDragStart={e => {
                               dragId.current = b.id;
                               e.dataTransfer.effectAllowed = 'move';
                               e.dataTransfer.setData('text/plain', b.id);
                           }}
                           onDragEnd={() => {
                               dragId.current = null;
                               setOverId(null);
                           }}
                           onDragOver={e => {
                               e.preventDefault();
                               if (overId !== b.id) setOverId(b.id);
                           }}
                           onDrop={e => {
                               e.preventDefault();
                               e.stopPropagation();
                               moveBefore(dragId.current, b.id);
                               setOverId(null);
                               dragId.current = null;
                           }}
                           onRemove={() => removeBlock(i)}
                           extra={def?.controls ? def.controls({block: b, setProp: (k, v) => setProp(i, k, v), pages}) : null}>
            {content}
        </BlockFrame>;
    }

    const grid = <div className={`page-grid cols-${columns}`}>
        {columnBlocks.map((col, c) => <div className="page-col" key={c}
                                           onDragOver={editing ? (e => e.preventDefault()) : undefined}
                                           onDrop={editing ? (e => {
                                               e.preventDefault();
                                               moveToColumn(dragId.current, c);
                                               dragId.current = null;
                                               setOverId(null);
                                           }) : undefined}>
            {col.map(o => renderBlock(o.b, o.i))}
            {editing && <div className="block-add">
                <span><Plus size={14}/> Add:</span>
                {Object.keys(registry).map(type => <button key={type} type="button"
                                                           onClick={() => addBlock(type, c)}>{registry[type].label}</button>)}
            </div>}
        </div>)}
    </div>;

    if (!editing) return grid;

    return <div className="page-builder">
        <div className="builder-toolbar">
            <span>Columns:</span>
            {[1, 2, 3].map(n => <button key={n} type="button" className={columns === n ? 'active' : ''}
                                        onClick={() => setLayout({columns: n})}>{n}</button>)}
            <span className="builder-hint">Drag the ⠿ handle to reorder blocks</span>
        </div>
        {grid}
    </div>;
}
