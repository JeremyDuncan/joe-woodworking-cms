import React, {useState} from 'react';
import {Plus} from 'lucide-react';
import {DndContext, DragOverlay, PointerSensor, closestCenter, useSensor, useSensors} from '@dnd-kit/core';
import {SortableContext, arrayMove, rectSortingStrategy, useSortable} from '@dnd-kit/sortable';
import {useEdit} from '../lib/edit.jsx';
import {BlockFrame} from './BlockFrame.jsx';

function spanOf(block, columns) {
    return Math.min(Math.max(1, block.props?.span || 1), columns);
}

// One sortable block. The grip handle carries the drag listeners so editable text
// inside the block isn't hijacked by the drag.
function SortableBlock({block, columns, label, extra, onRemove, children}) {
    // No transform/transition: on a variable-span grid those animations break.
    // We reorder the array live on drag-over instead, so blocks reflow cleanly.
    const {attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging} = useSortable({id: block.id});
    const style = {opacity: isDragging ? 0.4 : 1};
    return <div className={`page-block span-${spanOf(block, columns)}`} ref={setNodeRef} style={style}>
        <BlockFrame label={label} handleRef={setActivatorNodeRef} handleProps={{...attributes, ...listeners}}
                    onRemove={onRemove} extra={extra}>
            {children}
        </BlockFrame>
    </div>;
}

export function PageBuilder({route, layout, registry, featured, works, onImageOpen, pages}) {
    const {editing, setField} = useEdit();
    const columns = Math.min(3, Math.max(1, layout.columns || 1));
    const blocks = layout.blocks || [];
    const setLayout = patch => setField(['layout', route], {...layout, ...patch});
    const setBlocks = next => setLayout({blocks: next});
    const [activeId, setActiveId] = useState(null);
    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

    const setProp = (idx, key, value) => setBlocks(blocks.map((b, i) =>
        i === idx ? {...b, props: {...b.props, [key]: value}} : b));
    const setProps = (idx, patch) => setBlocks(blocks.map((b, i) =>
        i === idx ? {...b, props: {...b.props, ...patch}} : b));

    function addBlock(type) {
        const def = registry[type];
        const block = {id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, props: {...def.defaults}};
        setBlocks([...blocks, block]);
    }

    function removeBlock(idx) {
        setBlocks(blocks.filter((_, i) => i !== idx));
    }

    // Reorder live as the pointer moves over another block, so the grid reflows
    // out of the way without relying on (buggy on spanning grids) sortable tweens.
    function onDragOver(e) {
        const {active, over} = e;
        if (!over || active.id === over.id) return;
        const oldI = blocks.findIndex(b => b.id === active.id);
        const newI = blocks.findIndex(b => b.id === over.id);
        if (oldI < 0 || newI < 0 || oldI === newI) return;
        setBlocks(arrayMove(blocks, oldI, newI));
    }

    function content(b, i) {
        const Comp = registry[b.type]?.render;
        return Comp ? <Comp block={b} setProp={(k, v) => setProp(i, k, v)} editing={editing}
                            featured={featured} works={works} onImageOpen={onImageOpen}/> : null;
    }

    if (!editing) {
        return <div className={`page-grid cols-${columns}`}>
            {blocks.map((b, i) => <div className={`page-block span-${spanOf(b, columns)}`}
                                       key={b.id}>{content(b, i)}</div>)}
        </div>;
    }

    const activeIndex = blocks.findIndex(b => b.id === activeId);
    const activeBlock = activeIndex >= 0 ? blocks[activeIndex] : null;

    return <div className="page-builder">
        <div className="builder-toolbar">
            <span>Columns:</span>
            {[1, 2, 3].map(n => <button key={n} type="button" className={columns === n ? 'active' : ''}
                                        onClick={() => setLayout({columns: n})}>{n}</button>)}
            <span className="builder-hint">Drag the ⠿ handle to reorder · set a block’s Width to span columns</span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter}
                    onDragStart={e => setActiveId(e.active.id)} onDragOver={onDragOver}
                    onDragEnd={() => setActiveId(null)} onDragCancel={() => setActiveId(null)}>
            <SortableContext items={blocks.map(b => b.id)} strategy={rectSortingStrategy}>
                <div className={`page-grid cols-${columns}`}>
                    {blocks.map((b, i) => {
                        const def = registry[b.type];
                        return <SortableBlock key={b.id} block={b} columns={columns} label={def?.label || b.type}
                                              onRemove={() => removeBlock(i)}
                                              extra={def?.controls ? def.controls({block: b, setProp: (k, v) => setProp(i, k, v), setProps: patch => setProps(i, patch), pages, columns, works}) : null}>
                            {content(b, i)}
                        </SortableBlock>;
                    })}
                    <div className="block-add" style={{gridColumn: '1 / -1'}}>
                        <span><Plus size={14}/> Add:</span>
                        {Object.keys(registry).filter(type => !registry[type].legacy).map(type =>
                            <button key={type} type="button"
                                    onClick={() => addBlock(type)}>{registry[type].label}</button>)}
                    </div>
                </div>
            </SortableContext>

            <DragOverlay>
                {activeBlock ? <div className="page-block">
                    <BlockFrame label={registry[activeBlock.type]?.label || activeBlock.type} dragOverlay>
                        {content(activeBlock, activeIndex)}
                    </BlockFrame>
                </div> : null}
            </DragOverlay>
        </DndContext>
    </div>;
}
