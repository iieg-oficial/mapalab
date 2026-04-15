import { useEffect } from 'react';

export const useOutsideClick = (refs, onOutside) => {
    useEffect(() => {
        const handler = (e) => {
            if (e.target.closest('[role="dialog"], [aria-modal="true"]')) return;
            const clickedInside = refs.some((r) => r.current && r.current.contains(e.target));
            if (!clickedInside) onOutside?.(e);
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler, { passive: true });

        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [refs, onOutside]);
};