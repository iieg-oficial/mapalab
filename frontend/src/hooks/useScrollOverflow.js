import { useState, useEffect, useCallback, useRef } from 'react';

export const useScrollOverflow = (containerRef, { enabled = true } = {}) => {
    const [scrollState, setScrollState] = useState({
        canScrollUp: false,
        canScrollDown: false
    });
    const rafId = useRef(null);

    const checkScroll = useCallback(() => {
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
        }
        rafId.current = requestAnimationFrame(() => {
            if (containerRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
                const newCanScrollUp = scrollTop > 1;
                const newCanScrollDown = scrollTop + clientHeight < scrollHeight - 1;

                setScrollState(prev => {
                    if (prev.canScrollUp !== newCanScrollUp || prev.canScrollDown !== newCanScrollDown) {
                        return { canScrollUp: newCanScrollUp, canScrollDown: newCanScrollDown };
                    }
                    return prev;
                });
            }
        });
    }, [containerRef]);

    useEffect(() => {
        if (!enabled || !containerRef.current) return;

        const element = containerRef.current;

        checkScroll();

        const resizeObserver = new ResizeObserver(checkScroll);
        resizeObserver.observe(element);

        Array.from(element.children).forEach(child => {
            resizeObserver.observe(child);
        });

        const mutationObserver = new MutationObserver(checkScroll);
        mutationObserver.observe(element, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        element.addEventListener('scroll', checkScroll, { passive: true });
        window.addEventListener('resize', checkScroll);

        return () => {
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
            }
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            element?.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [enabled, containerRef, checkScroll]);

    return {
        ...scrollState,
        checkScroll
    };
};
