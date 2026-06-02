import React, {useLayoutEffect, useMemo, useRef, useState} from 'react';
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
function SortableBlock({block, columns, label, extra, onRemove, onResizeStart, resizing, children}) {
    // No transform/transition from dnd-kit: on a variable-span grid those break. We
    // reorder live on drag-over and animate resize reflow with FLIP (in PageBuilder).
    const {attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging} = useSortable({id: block.id});
    const style = {opacity: isDragging ? 0.4 : 1};
    return <div className={`page-block span-${spanOf(block, columns)}${resizing ? ' is-resizing' : ''}`}
                ref={setNodeRef} style={style} data-bid={block.id}>
        <BlockFrame label={label} handleRef={setActivatorNodeRef} handleProps={{...attributes, ...listeners}}
                    onRemove={onRemove} extra={extra}>
            {children}
        </BlockFrame>
        {/* Right edge only: a block can only grow/shrink rightward in this flow grid. */}
        {columns > 1 && <span className="block-resize block-resize-right" title="Drag to resize"
                              onPointerDown={onResizeStart}/>}
    </div>;
}

export function PageBuilder({route, layout, registry, featured, items, onImageOpen, pages, context = 'page'}) {
    const {editing, setField} = useEdit();
    const columns = Math.min(6, Math.max(1, layout.columns || 1));
    const blocks = layout.blocks || [];
    const setLayout = patch => setField(['layout', route], {...layout, ...patch});
    const setBlocks = next => setLayout({blocks: next});
    const [activeId, setActiveId] = useState(null);
    const [resizingId, setResizingId] = useState(null);
    // Stable item-id array for SortableContext: identity only changes when the order
    // actually changes (not on every prop edit / re-render), avoiding dnd-kit churn.
    const idsKey = blocks.map(b => b.id).join('|');
    const sortableItems = useMemo(() => (idsKey ? idsKey.split('|') : []), [idsKey]);
    const gridRef = useRef(null);
    const prevRects = useRef(new Map());
    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

    const setProp = (idx, key, value) => setBlocks(blocks.map((b, i) =>
        i === idx ? {...b, props: {...b.props, [key]: value}} : b));
    const setProps = (idx, patch) => setBlocks(blocks.map((b, i) =>
        i === idx ? {...b, props: {...b.props, ...patch}} : b));

    // FLIP: after a resize changes spans and shoves neighbours, let each block glide
    // from its old spot to its new one with a springy ease, like iOS icons settling.
    // We measure with offsetLeft/offsetTop (relative to the grid; immune to in-flight
    // transforms + page scroll, so neither can fake a layout change). We deliberately
    // skip this *during a dnd-kit drag* (activeId set): transforming the blocks while
    // dnd-kit is live-measuring them feeds back into its state and loops infinitely.
    useLayoutEffect(() => {
        if (!editing || !gridRef.current) return;
        // Keep measuring even while dragging (so prevRects stays current and there's no
        // jump on drop), but only *animate* when not dragging. We never write transforms
        // during a drag — that would change the rects dnd-kit measures and loop.
        const dragging = activeId != null;
        const next = new Map();
        gridRef.current.querySelectorAll('.page-block').forEach(el => {
            const id = el.dataset.bid;
            const pos = {left: el.offsetLeft, top: el.offsetTop};
            next.set(id, pos);
            const prev = prevRects.current.get(id);
            if (!dragging && prev && id !== resizingId) {
                const dx = prev.left - pos.left, dy = prev.top - pos.top;
                if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                    el.style.transition = 'none';
                    el.style.transform = `translate(${dx}px, ${dy}px)`;
                    requestAnimationFrame(() => {
                        el.style.transition = 'transform .32s cubic-bezier(.34, 1.4, .5, 1)';
                        el.style.transform = '';
                    });
                }
            }
        });
        prevRects.current = next;
    });

    // Drag a block's right edge to change how many columns it spans. The span snaps to
    // whole columns, measured against the grid's column width + gap.
    function startResize(e, idx) {
        e.preventDefault();
        e.stopPropagation();
        const gridEl = e.currentTarget.closest('.page-grid');
        const blockEl = e.currentTarget.closest('.page-block');
        if (!gridEl || !blockEl) return;
        const gridRect = gridEl.getBoundingClientRect();
        const gap = parseFloat(getComputedStyle(gridEl).columnGap) || 0;
        const slot = (gridRect.width + gap) / columns;
        const fixedLeft = blockEl.getBoundingClientRect().left;
        let last = spanOf(blocks[idx], columns);
        setResizingId(blocks[idx].id);

        function onMove(ev) {
            const span = Math.max(1, Math.min(columns, Math.round((ev.clientX - fixedLeft + gap) / slot)));
            if (span !== last) {
                last = span;
                setProp(idx, 'span', span);
            }
        }

        function onUp() {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            document.body.classList.remove('resizing-col');
            setResizingId(null);
        }

        document.body.classList.add('resizing-col');
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }

    function addBlock(type) {
        const def = registry[type];
        const block = {id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, props: {...def.defaults}};
        setBlocks([...blocks, block]);
    }

    function removeBlock(idx) {
        setBlocks(blocks.filter((_, i) => i !== idx));
    }

    // Live reorder while dragging — but driven by real pointer MOVEMENT (onDragMove),
    // not by re-measurement (onDragOver). The old onDragOver approach re-fired every time
    // a swap changed the layout, so holding the block near a boundary made two blocks flip
    // back and forth forever (and crash with "max update depth"). onDragMove only fires on
    // actual pointer motion, so a still pointer never swaps; a short throttle also caps the
    // swap rate during fast jiggles. Stable, and blocks still move out of the way live.
    const lastSwapAt = useRef(0);

    function onDragMove(e) {
        const {active, over} = e;
        if (!over || active.id === over.id) return;
        const now = Date.now();
        if (now - lastSwapAt.current < 70) return;
        const oldI = blocks.findIndex(b => b.id === active.id);
        const newI = blocks.findIndex(b => b.id === over.id);
        if (oldI < 0 || newI < 0 || oldI === newI) return;
        lastSwapAt.current = now;
        setBlocks(arrayMove(blocks, oldI, newI));
    }

    function content(b, i) {
        const Comp = registry[b.type]?.render;
        return Comp ? <Comp block={b} setProp={(k, v) => setProp(i, k, v)} editing={editing}
                            featured={featured} items={items} onImageOpen={onImageOpen} pages={pages}/> : null;
    }

    if (!editing) {
        return <div className={`page-grid cols-${columns}`}>
            {blocks.map((b, i) => <div className={`page-block span-${spanOf(b, columns)}`}
                                       key={b.id}>{content(b, i)}</div>)}
        </div>;
    }

    const activeIndex = blocks.findIndex(b => b.id === activeId);
    const activeBlock = activeIndex >= 0 ? blocks[activeIndex] : null;


    const isFooter = context === 'footer';
    const columnsLabel = isFooter ? 'Footer Columns:' : 'Main Page Columns:';
    return <div className="page-builder">
        <div className="builder-toolbar">
            <span>{columnsLabel}</span>
            {[1, 2, 3, 4, 5, 6].map(n => <button key={n} type="button" className={columns === n ? 'active' : ''}
                                                 onClick={() => setLayout({columns: n})}>{n}</button>)}
            <span className="builder-hint">Drag the ⠿ handle to reorder · drag a block’s side edge to resize</span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter}
                    onDragStart={e => setActiveId(e.active.id)} onDragMove={onDragMove}
                    onDragEnd={() => setActiveId(null)} onDragCancel={() => setActiveId(null)}>
            <SortableContext items={sortableItems} strategy={rectSortingStrategy}>
                <div className={`page-grid cols-${columns}`} ref={gridRef}>
                    {blocks.map((b, i) => {
                        const def = registry[b.type];
                        return <SortableBlock key={b.id} block={b} columns={columns} label={def?.label || b.type}
                                              onRemove={() => removeBlock(i)} resizing={resizingId === b.id}
                                              onResizeStart={e => startResize(e, i)}
                                              extra={def?.controls ? def.controls({block: b, setProp: (k, v) => setProp(i, k, v), setProps: patch => setProps(i, patch), pages, columns, items}) : null}>
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
