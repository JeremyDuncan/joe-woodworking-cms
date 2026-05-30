import React from 'react';
import {Plus} from 'lucide-react';
import {useEdit} from '../lib/edit.jsx';
import {BlockFrame} from './BlockFrame.jsx';

// Renders a page from a { columns, blocks:[{id,type,column,props}] } layout.
// Blocks are grouped into columns; array order sets vertical order within a column.
export function PageBuilder({route, layout, registry, featured, onImageOpen, pages}) {
    const {editing, setField} = useEdit();
    const columns = Math.min(3, Math.max(1, layout.columns || 1));
    const blocks = layout.blocks || [];
    const setLayout = patch => setField(['layout', route], {...layout, ...patch});
    const setBlocks = next => setLayout({blocks: next});
    const colOf = b => Math.min(columns - 1, Math.max(0, b.column || 0));

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

    function setColumn(idx, column) {
        setBlocks(blocks.map((b, i) => i === idx ? {...b, column} : b));
    }

    // Swap a block with its neighbour in the same column.
    function moveVertical(idx, dir) {
        const col = colOf(blocks[idx]);
        const sameCol = blocks.map((b, i) => ({b, i})).filter(o => colOf(o.b) === col);
        const pos = sameCol.findIndex(o => o.i === idx);
        const target = sameCol[pos + dir];
        if (!target) return;
        const next = blocks.slice();
        [next[idx], next[target.i]] = [next[target.i], next[idx]];
        setBlocks(next);
    }

    const columnBlocks = Array.from({length: columns}, (_, c) =>
        blocks.map((b, i) => ({b, i})).filter(o => colOf(o.b) === c));

    function renderBlock(b, i, posInColumn, colSize) {
        const def = registry[b.type];
        const Comp = def?.render;
        const content = Comp ? <Comp block={b} setProp={(k, v) => setProp(i, k, v)} editing={editing}
                                     featured={featured} onImageOpen={onImageOpen}/> : null;
        if (!editing) return <React.Fragment key={b.id}>{content}</React.Fragment>;
        const col = colOf(b);
        return <BlockFrame key={b.id} label={def?.label || b.type}
                           canUp={posInColumn > 0} canDown={posInColumn < colSize - 1}
                           canLeft={col > 0} canRight={col < columns - 1}
                           onUp={() => moveVertical(i, -1)} onDown={() => moveVertical(i, 1)}
                           onLeft={() => setColumn(i, col - 1)} onRight={() => setColumn(i, col + 1)}
                           onRemove={() => removeBlock(i)}
                           extra={def?.controls ? def.controls({block: b, setProp: (k, v) => setProp(i, k, v), pages}) : null}>
            {content}
        </BlockFrame>;
    }

    const grid = <div className={`page-grid cols-${columns}`}>
        {columnBlocks.map((col, c) => <div className="page-col" key={c}>
            {col.map((o, p) => renderBlock(o.b, o.i, p, col.length))}
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
        </div>
        {grid}
    </div>;
}
