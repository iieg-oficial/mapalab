import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const DRAG_ACTIVATION_DISTANCE = 4;
const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea';

export const useDraggablePanel = ({ panelRef, baseTransform = '' }) => {
    const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const startRef = useRef(null);
    const dragOffsetRef = useRef({ dx: 0, dy: 0 });

    const composedTransform = useCallback((dx, dy) => {
        const translate = `translate(${dx}px, ${dy}px)`;
        return baseTransform ? `${baseTransform} ${translate}` : translate;
    }, [baseTransform]);

    const applyTransformImmediate = useCallback((dx, dy) => {
        const el = panelRef.current;
        if (!el) return;
        el.style.transform = composedTransform(dx, dy);
    }, [panelRef, composedTransform]);

    useLayoutEffect(() => {
        applyTransformImmediate(dragOffset.dx, dragOffset.dy);
    }, [dragOffset.dx, dragOffset.dy, applyTransformImmediate]);

    const reset = useCallback(() => {
        dragOffsetRef.current = { dx: 0, dy: 0 };
        setDragOffset({ dx: 0, dy: 0 });
    }, []);

    const onPointerDown = useCallback((event) => {
        if (event.button !== undefined && event.button !== 0) return;
        const interactive = event.target.closest?.(INTERACTIVE_SELECTOR);
        if (interactive && interactive !== event.currentTarget && event.currentTarget.contains(interactive)) return;
        event.preventDefault();
        event.stopPropagation();
        startRef.current = {
            x: event.clientX,
            y: event.clientY,
            baseDx: dragOffsetRef.current.dx,
            baseDy: dragOffsetRef.current.dy,
            activated: false,
            pointerId: event.pointerId,
            target: event.currentTarget,
        };
    }, []);

    useEffect(() => {
        const handleMove = (event) => {
            const start = startRef.current;
            if (!start) return;
            const deltaX = event.clientX - start.x;
            const deltaY = event.clientY - start.y;
            if (!start.activated) {
                if (Math.hypot(deltaX, deltaY) < DRAG_ACTIVATION_DISTANCE) return;
                start.activated = true;
                try {
                    start.target?.setPointerCapture?.(start.pointerId);
                } catch {
                    // ignore
                }
                setIsDragging(true);
            }
            applyTransformImmediate(start.baseDx + deltaX, start.baseDy + deltaY);
        };

        const handleUp = (event) => {
            const start = startRef.current;
            if (!start) return;
            try {
                start.target?.releasePointerCapture?.(start.pointerId);
            } catch {
                // ignore
            }
            if (start.activated) {
                const finalDx = start.baseDx + (event.clientX - start.x);
                const finalDy = start.baseDy + (event.clientY - start.y);
                dragOffsetRef.current = { dx: finalDx, dy: finalDy };
                setDragOffset({ dx: finalDx, dy: finalDy });
            }
            startRef.current = null;
            setIsDragging(false);
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleUp);
        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
            window.removeEventListener('pointercancel', handleUp);
        };
    }, [applyTransformImmediate]);

    return {
        dragOffset,
        isDragging,
        handleProps: { onPointerDown },
        reset,
    };
};
