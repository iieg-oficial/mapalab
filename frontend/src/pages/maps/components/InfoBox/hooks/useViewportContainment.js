/* eslint-disable react-hooks/exhaustive-deps */
import { useLayoutEffect, useCallback } from 'react';

export const useViewportContainment = (ref, dependencies = [], margin = 10, paused = false) => {
    const adjustPosition = useCallback(() => {
        if (paused || !ref.current) return;

        const el = ref.current;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        el.style.maxHeight = '';

        let rect = el.getBoundingClientRect();
        const contentHeight = el.scrollHeight || el.offsetHeight;

        if (rect.left < margin) {
            const currentLeft = parseFloat(el.style.left || 0);
            el.style.left = `${currentLeft + (margin - rect.left)}px`;
        } else if (rect.right > viewportWidth - margin) {
            const currentLeft = parseFloat(el.style.left || 0);
            el.style.left = `${currentLeft - (rect.right - (viewportWidth - margin))}px`;
        }

        rect = el.getBoundingClientRect();

        const spaceAbove = rect.top - margin;
        const spaceBelow = viewportHeight - rect.bottom - margin;
        const exceedsBottom = rect.bottom > viewportHeight - margin;
        const exceedsTop = rect.top < margin;

        if (exceedsTop && exceedsBottom) {
            const currentTop = parseFloat(el.style.top || 0);
            el.style.top = `${currentTop + (margin - rect.top)}px`;
            el.style.maxHeight = `${viewportHeight - margin * 2}px`;
            return;
        }

        if (exceedsTop) {
            const currentTop = parseFloat(el.style.top || 0);
            el.style.top = `${currentTop + (margin - rect.top)}px`;
            rect = el.getBoundingClientRect();
        }

        if (exceedsBottom) {
            const overflow = rect.bottom - (viewportHeight - margin);

            if (contentHeight <= spaceAbove && spaceAbove > spaceBelow) {
                const currentTop = parseFloat(el.style.top || 0);
                el.style.top = `${currentTop - overflow - (contentHeight - rect.height)}px`;
            } else if (contentHeight <= viewportHeight - margin * 2) {
                const currentTop = parseFloat(el.style.top || 0);
                el.style.top = `${currentTop - overflow}px`;
            } else {
                const currentTop = parseFloat(el.style.top || 0);
                const availableHeight = viewportHeight - margin * 2;
                el.style.top = `${currentTop - (rect.top - margin)}px`;
                el.style.maxHeight = `${availableHeight}px`;
            }
        }
    }, [ref, margin, paused]);

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
    }, [ref, adjustPosition, ...dependencies]);
};
