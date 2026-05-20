import { useCallback, useEffect, useRef } from 'react';

const SWIPE_UP_THRESHOLD = 60;

const SwipeUpWrapper = ({ enabled, onDismiss, children }) => {
    const containerRef = useRef(null);
    const startYRef = useRef(null);
    const draggingRef = useRef(false);
    const translateYRef = useRef(0);
    const onDismissRef = useRef(onDismiss);

    useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);

    const handlePointerDown = useCallback((e) => {
        if (e.pointerType === 'mouse') return;
        startYRef.current = e.clientY;
        draggingRef.current = true;
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    }, []);

    const handlePointerMove = useCallback((e) => {
        if (!draggingRef.current || startYRef.current == null) return;
        const delta = e.clientY - startYRef.current;
        const dy = delta < 0 ? delta : 0;
        translateYRef.current = dy;
        const el = containerRef.current;
        if (!el) return;
        el.style.transition = 'none';
        el.style.transform = dy ? `translate3d(0, ${dy}px, 0)` : '';
        el.style.opacity = dy < 0 ? String(Math.max(0, 1 + dy / 120)) : '1';
    }, []);

    const finishDrag = useCallback(() => {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        startYRef.current = null;
        const el = containerRef.current;
        if (!el) return;
        el.style.transition = 'transform 150ms ease-out, opacity 150ms ease-out';
        if (translateYRef.current < -SWIPE_UP_THRESHOLD) {
            el.style.transform = 'translate3d(0, -200px, 0)';
            el.style.opacity = '0';
            translateYRef.current = -200;
            setTimeout(() => onDismissRef.current?.(), 150);
        } else {
            el.style.transform = '';
            el.style.opacity = '1';
            translateYRef.current = 0;
        }
    }, []);

    if (!enabled) return children;

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            style={{ touchAction: 'pan-x', willChange: 'transform' }}
        >
            {children}
        </div>
    );
};

export default SwipeUpWrapper;
