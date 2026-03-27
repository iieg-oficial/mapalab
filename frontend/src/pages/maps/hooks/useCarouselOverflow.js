import { useState, useEffect, useRef, useCallback } from 'react';

export const useCarouselOverflow = () => {
    const scrollRef = useRef(null);
    const [hasOverflow, setHasOverflow] = useState(false);

    const checkOverflow = useCallback(() => {
        if (scrollRef.current) {
            setHasOverflow(
                scrollRef.current.scrollWidth > scrollRef.current.clientWidth
            );
        }
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        checkOverflow();

        const observer = new ResizeObserver(checkOverflow);
        observer.observe(el);
        window.addEventListener('resize', checkOverflow);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', checkOverflow);
        };
    });

    const scroll = useCallback((direction) => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.clientWidth * 0.8;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    }, []);

    return { scrollRef, hasOverflow, scroll, checkOverflow };
};
