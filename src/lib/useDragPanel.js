import {useEffect, useRef, useState} from 'react';

// Makes a fixed panel draggable by a header element. Spread {onMouseDown} on the
// header, put {ref} on the panel, and apply {style} to the panel.
export function useDragPanel() {
    const panelRef = useRef(null);
    const dragRef = useRef(null);
    const [pos, setPos] = useState(null);

    function onHeadDown(e) {
        if (e.button !== 0 || e.target.closest('.theme-close')) return;
        const rect = panelRef.current.getBoundingClientRect();
        dragRef.current = {dx: e.clientX - rect.left, dy: e.clientY - rect.top};
        e.preventDefault();
    }

    useEffect(() => {
        function move(e) {
            if (dragRef.current) setPos({x: e.clientX - dragRef.current.dx, y: e.clientY - dragRef.current.dy});
        }

        function up() {
            dragRef.current = null;
        }

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
        };
    }, []);

    const style = pos ? {left: pos.x, top: pos.y, right: 'auto', bottom: 'auto', transform: 'none'} : undefined;
    return {panelRef, onHeadDown, style};
}
