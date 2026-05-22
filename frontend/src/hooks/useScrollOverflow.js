import { useState, useEffect, useCallback, useRef } from 'react';

export const useScrollOverflow = (containerRef, { enabled = true } = {}) => {
    const [scrollState, setScrollState] = useState({
        canScrollUp: false,
        canScrollDown: false,
        stickyAtTop: false,
        stickyAtBottom: false,
        stickyHeight: 0
    });
    const rafId = useRef(null);
    const stickyElRef = useRef(null);
    const stickyResizeObserverRef = useRef(null);

    const checkScroll = useCallback(() => {
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
        }
        rafId.current = requestAnimationFrame(() => {
            if (!containerRef.current) return;
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            const newCanScrollUp = scrollTop > 1;
            const newCanScrollDown = scrollTop + clientHeight < scrollHeight - 1;

            let newStickyAtTop = false;
            let newStickyAtBottom = false;
            let newStickyHeight = 0;
            const stickyEl = containerRef.current.querySelector('[data-sticky]');
            if (stickyEl) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const elRect = stickyEl.getBoundingClientRect();
                newStickyAtTop = newCanScrollUp && Math.abs(elRect.top - containerRect.top) < 2;
                newStickyAtBottom = newCanScrollDown && Math.abs(elRect.bottom - containerRect.bottom) < 2;
                newStickyHeight = Math.round(elRect.height);

                if (stickyElRef.current !== stickyEl) {
                    if (stickyResizeObserverRef.current) {
                        stickyResizeObserverRef.current.disconnect();
                    }
                    stickyElRef.current = stickyEl;
                    if (typeof ResizeObserver !== 'undefined') {
                        stickyResizeObserverRef.current = new ResizeObserver(checkScroll);
                        stickyResizeObserverRef.current.observe(stickyEl);
                    }
                }
            } else if (stickyElRef.current) {
                if (stickyResizeObserverRef.current) {
                    stickyResizeObserverRef.current.disconnect();
                    stickyResizeObserverRef.current = null;
                }
                stickyElRef.current = null;
            }

            setScrollState(prev => {
                if (
                    prev.canScrollUp !== newCanScrollUp ||
                    prev.canScrollDown !== newCanScrollDown ||
                    prev.stickyAtTop !== newStickyAtTop ||
                    prev.stickyAtBottom !== newStickyAtBottom ||
                    prev.stickyHeight !== newStickyHeight
                ) {
                    return {
                        canScrollUp: newCanScrollUp,
                        canScrollDown: newCanScrollDown,
                        stickyAtTop: newStickyAtTop,
                        stickyAtBottom: newStickyAtBottom,
                        stickyHeight: newStickyHeight
                    };
                }
                return prev;
            });
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
        window.addEventListener('resize', checkScroll, { passive: true });

        return () => {
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
            }
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            if (stickyResizeObserverRef.current) {
                stickyResizeObserverRef.current.disconnect();
                stickyResizeObserverRef.current = null;
            }
            stickyElRef.current = null;
            element?.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll, { passive: true });
        };
    }, [enabled, containerRef, checkScroll]);

    return {
        ...scrollState,
        checkScroll
    };
};
