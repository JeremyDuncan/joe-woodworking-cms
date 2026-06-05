import React, {useLayoutEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Check, Columns3, Copyright, Grid3x3, Heading, Image as ImageIcon, LayoutGrid, List, Magnet, Minus, MousePointerClick, Pilcrow, Plus, Star} from 'lucide-react';
import {DndContext, DragOverlay, PointerSensor, closestCenter, pointerWithin, useSensor, useSensors} from '@dnd-kit/core';
import {SortableContext, arrayMove, rectSortingStrategy, useSortable} from '@dnd-kit/sortable';
import {useEdit} from '../lib/edit.jsx';
import {BlockFrame} from './BlockFrame.jsx';

const BLOCK_ICONS = {
    divider: Minus, eyebrow: Star, heading: Heading, text: Pilcrow, button: MousePointerClick,
    list: List, image: ImageIcon, item: LayoutGrid, copyright: Copyright
};

// A popover of block types, opened from any "+" trigger so blocks can be added exactly
// where you want them instead of only at the bottom of the page.
function BlockPicker({registry, anchor, onPick, onClose}) {
    const types = Object.keys(registry).filter(t => !registry[t].legacy && registry[t].render);
    return createPortal(
        <div className="ctl-menu-backdrop" onMouseDown={onClose}>
            <div className="block-picker" style={anchor} onMouseDown={e => e.stopPropagation()}>
                <div className="block-picker-head">Add a block</div>
                <div className="block-picker-grid">
                    {types.map(t => {
                        const Icon = BLOCK_ICONS[t] || Plus;
                        return <button key={t} type="button" className="block-picker-item" onClick={() => onPick(t)}>
                            <Icon size={18}/><span>{registry[t].label}</span>
                        </button>;
                    })}
                </div>
            </div>
        </div>, document.body);
}

// One icon showing the current column count; click to pick 1–6 from a popover.
function ColumnsMenu({columns, setColumns}) {
    const ref = useRef(null);
    const [pos, setPos] = useState(null);
    const open = () => {
        if (pos) return setPos(null);
        const r = ref.current.getBoundingClientRect();
        setPos({top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 180))});
    };
    return <>
        <button ref={ref} type="button" className="builder-ctl-btn block-ctl-btn has-badge"
                data-tip={`Columns: ${columns}`} aria-label="Page columns" onClick={open}>
            <Columns3 size={15}/><span className="builder-ctl-badge">{columns}</span>
        </button>
        {pos && createPortal(
            <div className="ctl-menu-backdrop" onMouseDown={() => setPos(null)}>
                <div className="ctl-menu-pop" style={pos} onMouseDown={e => e.stopPropagation()}>
                    <div className="ctl-menu-head">Columns</div>
                    {[1, 2, 3, 4, 5, 6].map(n =>
                        <button key={n} type="button" className="ctl-menu-item"
                                onClick={() => {
                                    setColumns(n);
                                    setPos(null);
                                }}>
                            <span>{n} column{n > 1 ? 's' : ''}</span>{n === columns && <Check size={14}/>}
                        </button>)}
                </div>
            </div>, document.body)}
    </>;
}

// The compact builder controls (columns + placement + guides) shared by the admin bar
// (main page) and the inline footer toolbar.
function BuilderControls({columns, setColumns, free, enableFlow, enableFree, guides, setGuides}) {
    return <div className="builder-controls">
        <ColumnsMenu columns={columns} setColumns={setColumns}/>
        <span className="builder-ctl-sep"/>
        <button type="button" className={`builder-ctl-btn block-ctl-btn${!free ? ' active' : ''}`}
                data-tip="Flow placement — blocks shift to make room" aria-label="Flow placement"
                onClick={enableFlow}><Magnet size={15}/></button>
        <button type="button" className={`builder-ctl-btn block-ctl-btn${free ? ' active' : ''}`}
                data-tip="Free placement — drop blocks in any open cell" aria-label="Free placement"
                onClick={enableFree}><LayoutGrid size={15}/></button>
        <span className="builder-ctl-sep"/>
        <button type="button" className={`builder-ctl-btn block-ctl-btn${guides ? ' active' : ''}`}
                data-tip={guides ? 'Hide column & row guides' : 'Show column & row guides'}
                aria-label="Toggle layout guides" onClick={() => setGuides(g => !g)}><Grid3x3 size={15}/></button>
    </div>;
}

function spanOf(block, columns) {
    return Math.min(Math.max(1, block.props?.span || 1), columns);
}

// Explicit start column (1-based) clamped so the block always fits; 0 = auto (flow mode).
function colOf(block, columns) {
    const c = block.props?.col;
    return c ? Math.max(1, Math.min(columns - spanOf(block, columns) + 1, c)) : 0;
}

function rowOf(block) {
    return Math.max(1, block.props?.row || 1);
}

// Free-mode collision test: are the columns col..col+span-1 on `row` clear of every other
// block? Used so placed blocks never overlap and never auto-shift.
function cellFree(blocks, columns, id, row, col, span) {
    if (col < 1 || col + span - 1 > columns) return false;
    return !blocks.some(b => {
        if (b.id === id || rowOf(b) !== row) return false;
        const bc = colOf(b, columns) || 1;
        return col <= bc + spanOf(b, columns) - 1 && bc <= col + span - 1;
    });
}

// Resolve any overlaps by pushing the colliding block down to the next free row — used after
// a column change so blocks that no longer fit side by side fall into their own rows rather
// than stacking on top of each other. Reading order is preserved; non-colliding gaps stay.
function packFree(blocks, columns) {
    const order = blocks.map((b, i) => ({i, row: rowOf(b), col: colOf(b, columns) || 1, span: spanOf(b, columns)}))
        .sort((a, z) => (a.row - z.row) || (a.col - z.col) || (a.i - z.i));
    const taken = {};
    const hits = (r, c, s) => (taken[r] || []).some(([s0, e0]) => c <= e0 && s0 <= c + s - 1);
    const out = blocks.slice();
    order.forEach(({i, row, col, span}) => {
        let r = row;
        while (hits(r, col, span)) r++;
        (taken[r] = taken[r] || []).push([col, col + span - 1]);
        out[i] = {...blocks[i], props: {...blocks[i].props, row: r}};
    });
    return out;
}

// One draggable block. In flow mode it sizes by the .span-N class and the grid packs it; in
// free mode it's placed explicitly via CSS custom properties (overridable on mobile).
function SortableBlock({block, columns, free, col, span, row, label, extra, onRemove, onResizeStart, onInsert, resizing, children}) {
    const {attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging} = useSortable({id: block.id});
    const style = free
        ? {opacity: isDragging ? 0.4 : 1, '--bcol': col || 1, '--bspan': span, '--brow': row}
        : {opacity: isDragging ? 0.4 : 1};
    const cls = free
        ? `page-block free${resizing ? ' is-resizing' : ''}`
        : `page-block span-${span}${resizing ? ' is-resizing' : ''}`;
    return <div className={cls} ref={setNodeRef} style={style} data-bid={block.id}>
        {/* Flow mode: hover "+" to insert a new block right before this one. */}
        {!free && onInsert && <button type="button" className="block-insert" data-tip="Add a block here"
                                      aria-label="Add a block here" onClick={onInsert}><Plus size={14}/></button>}
        <BlockFrame label={label} handleRef={setActivatorNodeRef} handleProps={{...attributes, ...listeners}}
                    onRemove={onRemove} extra={extra} wrapActions={block.type === 'list'}>
            {children}
        </BlockFrame>
        {columns > 1 && <span className="block-resize block-resize-right" title="Drag to resize"
                              onPointerDown={onResizeStart}/>}
    </div>;
}

export function PageBuilder({route, layout, registry, featured, items, onImageOpen, pages, context = 'page'}) {
    const {editing, setField} = useEdit();
    const columns = Math.min(6, Math.max(1, layout.columns || 1));
    const blocks = layout.blocks || [];
    const free = layout.mode === 'free';
    const maxRow = blocks.reduce((m, b) => Math.max(m, rowOf(b)), 0);
    const setLayout = patch => setField(['layout', route], {...layout, ...patch});
    const setBlocks = next => setLayout({blocks: next});

    // Changing the column count rescales blocks proportionally so they keep their relative
    // width — and, in Free mode, their relative position too (using 0-based column math so a
    // block at the left edge stays at the left edge instead of drifting right).
    function setColumns(n) {
        if (n === columns) return;
        let next = blocks.map(b => {
            const span = Math.max(1, Math.min(n, Math.round((spanOf(b, columns) / columns) * n)));
            const patch = {span};
            if (free) {
                const oldCol = colOf(b, columns);
                if (oldCol) patch.col = Math.max(1, Math.min(n - span + 1, Math.round((oldCol - 1) / columns * n) + 1));
            }
            return {...b, props: {...b.props, ...patch}};
        });
        // Free mode: after rescaling, make sure nothing ended up overlapping (e.g. several
        // blocks squeezed onto column 1 when dropping to a single column) — push them apart.
        if (free) next = packFree(next, n);
        setLayout({columns: n, blocks: next});
    }

    const [activeId, setActiveId] = useState(null);
    const [resizingId, setResizingId] = useState(null);
    const [guides, setGuides] = useState(false);
    const [rowTops, setRowTops] = useState([]);
    // The main page's builder controls live in the admin bar (a portal target it renders).
    // The footer builder keeps them inline, next to the footer.
    const [controlSlot, setControlSlot] = useState(null);
    useLayoutEffect(() => {
        if (context === 'footer') return;
        const el = document.getElementById('admin-builder-slot');
        setControlSlot(prev => (prev === el ? prev : el));
    });
    const rowKey = useRef('');
    const dragLeft = useRef(null);
    const dragTop = useRef(null);
    const lastSwapAt = useRef(0);
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

    // FLIP: after a move/resize shoves blocks, let each glide from its old spot to its new
    // one. We measure with offsetLeft/offsetTop (immune to in-flight transforms + scroll) and
    // skip *during* a drag (activeId set) so we never feed transforms back into dnd-kit.
    useLayoutEffect(() => {
        if (!editing || !gridRef.current) return;
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

    // While guides are on, find the distinct top of each block row so we can draw a
    // horizontal line per row. Runs every render but only updates state when the set of row
    // positions changes, so it can't loop.
    useLayoutEffect(() => {
        if (!editing || !guides || !gridRef.current) return;
        const els = [...gridRef.current.querySelectorAll('.page-block')];
        const ys = els.map(el => Math.round(el.offsetTop));
        if (els.length) ys.push(Math.round(Math.max(...els.map(el => el.offsetTop + el.offsetHeight))));
        const lines = [...new Set(ys)].sort((a, b) => a - b);
        const key = lines.join(',');
        if (key !== rowKey.current) {
            rowKey.current = key;
            setRowTops(lines);
        }
    });

    // ---- Mode switching: snapshot the current visual layout into explicit row/col when
    // turning Free on (so it looks identical), and sort blocks row-major when turning it off
    // (so Flow packs them in the same visual order). ----
    function enableFree() {
        const gridEl = gridRef.current;
        if (!gridEl) return setLayout({mode: 'free'});
        const rect = gridEl.getBoundingClientRect();
        const slot = (rect.width + (parseFloat(getComputedStyle(gridEl).columnGap) || 0)) / columns;
        const tops = [...new Set(blocks.map(b => {
            const el = gridEl.querySelector(`[data-bid="${b.id}"]`);
            return el ? Math.round(el.offsetTop) : 0;
        }))].sort((a, b) => a - b);
        const next = blocks.map(b => {
            const el = gridEl.querySelector(`[data-bid="${b.id}"]`);
            if (!el) return b;
            const col = Math.max(1, Math.min(columns, Math.round(el.offsetLeft / slot) + 1));
            const row = tops.indexOf(Math.round(el.offsetTop)) + 1;
            return {...b, props: {...b.props, col, row}};
        });
        setLayout({mode: 'free', blocks: next});
    }

    function enableFlow() {
        const sorted = [...blocks].sort((a, b) => (rowOf(a) - rowOf(b)) || ((colOf(a, columns) || 1) - (colOf(b, columns) || 1)));
        setLayout({mode: 'flow', blocks: sorted});
    }

    // ---- Drag ----
    function onDragStart(e) {
        setActiveId(e.active.id);
        const r = gridRef.current?.querySelector(`[data-bid="${e.active.id}"]`)?.getBoundingClientRect();
        dragLeft.current = r ? r.left : null;
        dragTop.current = r ? r.top : null;
    }

    // Flow only: live reorder driven by real pointer MOVEMENT (not re-measurement), throttled
    // so a held pointer never oscillates. Free mode never reorders — it places on drop.
    function onDragMove(e) {
        if (free) return;
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

    function onDragEnd(e) {
        if (free) placeFree(e);
        setActiveId(null);
    }

    function rowFromY(cs, y) {
        const rowGap = parseFloat(cs.rowGap) || 0;
        const tracks = (cs.gridTemplateRows || '').split(' ').map(parseFloat).filter(n => !isNaN(n));
        let acc = 0;
        for (let i = 0; i < tracks.length; i++) {
            if (y < acc + tracks[i] + rowGap / 2) return i + 1;
            acc += tracks[i] + rowGap;
        }
        return tracks.length + 1;
    }

    // Drop the block into the cell under the pointer. If that exact cell is taken, snap to the
    // nearest free column in the same row; if the row is full, leave it where it was (you make
    // the room). Nothing else moves.
    function placeFree(e) {
        const idx = blocks.findIndex(b => b.id === e.active.id);
        if (idx < 0 || !gridRef.current || dragLeft.current == null) return;
        const gridEl = gridRef.current;
        const rect = gridEl.getBoundingClientRect();
        const cs = getComputedStyle(gridEl);
        const slot = (rect.width + (parseFloat(cs.columnGap) || 0)) / columns;
        const span = spanOf(blocks[idx], columns);
        const id = blocks[idx].id;
        const wantCol = Math.max(1, Math.min(columns - span + 1,
            Math.round(((dragLeft.current + (e.delta?.x || 0)) - rect.left) / slot) + 1));
        const wantRow = rowFromY(cs, (dragTop.current + (e.delta?.y || 0)) - rect.top);
        let placed = cellFree(blocks, columns, id, wantRow, wantCol, span) ? {row: wantRow, col: wantCol} : null;
        for (let d = 1; d < columns && !placed; d++) {
            if (cellFree(blocks, columns, id, wantRow, wantCol - d, span)) placed = {row: wantRow, col: wantCol - d};
            else if (cellFree(blocks, columns, id, wantRow, wantCol + d, span)) placed = {row: wantRow, col: wantCol + d};
        }
        if (placed) setProps(idx, {col: placed.col, row: placed.row});
    }

    // Drag a block's right edge to change its span. In flow it can grow to the grid edge; in
    // free it can only grow into the empty cells to its right (stops at the next block).
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
        let maxSpan = columns;
        if (free) {
            const r = rowOf(blocks[idx]);
            const col = colOf(blocks[idx], columns) || 1;
            maxSpan = columns - col + 1;
            blocks.forEach(b => {
                if (b.id === blocks[idx].id || rowOf(b) !== r) return;
                const bc = colOf(b, columns) || 1;
                if (bc > col) maxSpan = Math.min(maxSpan, bc - col);
            });
        }
        setResizingId(blocks[idx].id);

        function onMove(ev) {
            const span = Math.max(1, Math.min(maxSpan, Math.round((ev.clientX - fixedLeft + gap) / slot)));
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

    // `where`: {kind:'append'} (bottom), {kind:'index', index} (flow, insert before), or
    // {kind:'cell', col, row} (free, drop into a specific empty cell).
    function addBlock(type, where = {kind: 'append'}) {
        const def = registry[type];
        const props = {...def.defaults};
        if (free) {
            if (where.kind === 'cell') {
                props.col = where.col;
                props.row = where.row;
            } else {
                props.col = 1;
                props.row = maxRow + 1;
            }
        }
        const block = {id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, props};
        setBlocks(where.kind === 'index'
            ? [...blocks.slice(0, where.index), block, ...blocks.slice(where.index)]
            : [...blocks, block]);
    }

    // The block picker: {anchor:{top,left}, where}. Opened from any "+" trigger.
    const [picker, setPicker] = useState(null);
    const openPicker = (where, e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const left = Math.max(8, Math.min(r.left, window.innerWidth - 330));
        setPicker({anchor: {top: r.bottom + 6, left}, where});
    };

    function removeBlock(idx) {
        setBlocks(blocks.filter((_, i) => i !== idx));
    }

    function content(b, i) {
        const Comp = registry[b.type]?.render;
        return Comp ? <Comp block={b} setProp={(k, v) => setProp(i, k, v)} editing={editing}
                            featured={featured} items={items} onImageOpen={onImageOpen} pages={pages}/> : null;
    }

    if (!editing) {
        return <div className={`page-grid cols-${columns}${free ? ' free-grid' : ''}`}>
            {blocks.map((b, i) => {
                const span = spanOf(b, columns);
                return free
                    ? <div className="page-block free" key={b.id}
                           style={{'--bcol': colOf(b, columns) || 1, '--bspan': span, '--brow': rowOf(b)}}>{content(b, i)}</div>
                    : <div className={`page-block span-${span}`} key={b.id}>{content(b, i)}</div>;
            })}
        </div>;
    }

    const activeIndex = blocks.findIndex(b => b.id === activeId);
    const activeBlock = activeIndex >= 0 ? blocks[activeIndex] : null;

    // Free mode: every grid cell (through one row past the content) that no block occupies,
    // so each can show an "add here" tile.
    const emptyCells = [];
    if (free) {
        const taken = new Set();
        blocks.forEach(b => {
            const c = colOf(b, columns) || 1, s = spanOf(b, columns), r = rowOf(b);
            for (let i = 0; i < s; i++) taken.add(`${r}:${c + i}`);
        });
        for (let r = 1; r <= maxRow + 1; r++)
            for (let c = 1; c <= columns; c++)
                if (!taken.has(`${r}:${c}`)) emptyCells.push({row: r, col: c});
    }

    const isFooter = context === 'footer';
    const controls = <BuilderControls columns={columns} setColumns={setColumns} free={free}
                                      enableFlow={enableFlow} enableFree={enableFree}
                                      guides={guides} setGuides={setGuides}/>;
    return <div className="page-builder">
        {/* Main page: render the controls into the admin bar. Footer: keep them inline. */}
        {!isFooter && controlSlot && createPortal(controls, controlSlot)}
        <div className="builder-toolbar">
            {isFooter && controls}
            <span className="builder-hint">{free
                ? 'Drag a block into any open cell · drag its side edge to resize into the space'
                : 'Drag the ⠿ handle to reorder · drag a block’s side edge to resize'}</span>
        </div>

        <DndContext sensors={sensors} collisionDetection={free ? pointerWithin : closestCenter}
                    onDragStart={onDragStart} onDragMove={onDragMove}
                    onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
            <SortableContext items={sortableItems} strategy={rectSortingStrategy}>
                <div className={`page-grid cols-${columns}${free ? ' free-grid' : ''}${guides ? ' show-guides' : ''}`} ref={gridRef}>
                    {guides && <div className="grid-guides" aria-hidden="true">
                        <div className={`grid-guides-cols cols-${columns}`}>
                            {Array.from({length: columns}, (_, i) => <span key={i} className="grid-guide-col"/>)}
                        </div>
                        {rowTops.map((t, i) => <span key={i} className="grid-guide-row" style={{top: `${t}px`}}/>)}
                    </div>}
                    {blocks.map((b, i) => {
                        const def = registry[b.type];
                        return <SortableBlock key={b.id} block={b} columns={columns} free={free}
                                              col={colOf(b, columns)} span={spanOf(b, columns)} row={rowOf(b)}
                                              label={def?.label || b.type}
                                              onRemove={() => removeBlock(i)} resizing={resizingId === b.id}
                                              onResizeStart={e => startResize(e, i)}
                                              onInsert={e => openPicker({kind: 'index', index: i}, e)}
                                              extra={def?.controls ? def.controls({block: b, setProp: (k, v) => setProp(i, k, v), setProps: patch => setProps(i, patch), pages, columns, items}) : null}>
                            {content(b, i)}
                        </SortableBlock>;
                    })}
                    {/* Free mode: a "+" tile in every empty cell, so you can add a block right
                        where it's missing instead of only at the bottom. */}
                    {free && emptyCells.map(({row, col}) =>
                        <button key={`add-${row}-${col}`} type="button" className="cell-add"
                                style={{'--bcol': col, '--brow': row}} data-tip="Add a block here"
                                aria-label="Add a block here"
                                onClick={e => openPicker({kind: 'cell', col, row}, e)}><Plus size={16}/></button>)}
                    <div className="block-add"
                         style={free ? {gridColumn: '1 / -1', gridRow: maxRow + 2} : {gridColumn: '1 / -1'}}>
                        <button type="button" className="block-add-btn" onClick={e => openPicker({kind: 'append'}, e)}>
                            <Plus size={16}/> Add a block
                        </button>
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

        {picker && <BlockPicker registry={registry} anchor={picker.anchor}
                                onPick={type => {
                                    addBlock(type, picker.where);
                                    setPicker(null);
                                }}
                                onClose={() => setPicker(null)}/>}
    </div>;
}
