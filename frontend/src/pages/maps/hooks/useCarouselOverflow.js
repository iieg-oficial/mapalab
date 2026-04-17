import { useState, useEffect, useRef, useCallback } from 'react';

export const useCarouselOverflow = () => {
    const scrollRef = useRef(null);
    const [hasOverflow, setHasOverflow] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkOverflow = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const overflow = el.scrollWidth > el.clientWidth;
        setHasOverflow(overflow);
        setCanScrollLeft(el.scrollLeft > 1);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        checkOverflow();

        const observer = new ResizeObserver(checkOverflow);
        observer.observe(el);
        el.addEventListener('scroll', checkOverflow);
        window.addEventListener('resize', checkOverflow);

        return () => {
            observer.disconnect();
            el.removeEventListener('scroll', checkOverflow);
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

    return { scrollRef, hasOverflow, canScrollLeft, canScrollRight, scroll, checkOverflow };
};
