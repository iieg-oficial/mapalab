import { useLayoutEffect, useCallback } from 'react';

export const useViewportContainment = (ref, dependencies = [], margin = 10) => {
    const adjustPosition = useCallback(() => {
        if (!ref.current) return;

        const el = ref.current;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let rect = el.getBoundingClientRect();

        if (rect.left < margin) {
            const currentLeft = parseFloat(el.style.left || 0);
            el.style.left = `${currentLeft + (margin - rect.left)}px`;
        } else if (rect.right > viewportWidth - margin) {
            const currentLeft = parseFloat(el.style.left || 0);
            el.style.left = `${currentLeft - (rect.right - (viewportWidth - margin))}px`;
        }

        rect = el.getBoundingClientRect();

        if (rect.top < margin) {
            const currentTop = parseFloat(el.style.top || 0);
            el.style.top = `${currentTop + (margin - rect.top)}px`;
            rect = el.getBoundingClientRect();
        }

        const availableHeight = viewportHeight - rect.top - margin;

        if (rect.bottom > viewportHeight - margin) {
            if (rect.height <= availableHeight) {
                const currentTop = parseFloat(el.style.top || 0);
                el.style.top = `${currentTop - (rect.bottom - (viewportHeight - margin))}px`;
            } else {
                el.style.maxHeight = `${availableHeight}px`;
            }
        } else {
            el.style.maxHeight = '';
        }
    }, [ref, margin]);

    useLayoutEffect(() => {
        adjustPosition();
    }, dependencies);

    useLayoutEffect(() => {
        if (!ref.current) return;

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => {
                adjustPosition();
            });
        });

        resizeObserver.observe(ref.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [ref, adjustPosition]);
};
