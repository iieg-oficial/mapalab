import { useEffect } from 'react';

export const useOutsideClick = (refs, onOutside) => {
    useEffect(() => {
        const handler = (e) => {
            const clickedInside = refs.some((r) => r.current && r.current.contains(e.target));
            if (!clickedInside) onOutside?.(e);
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);

        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [refs, onOutside]);
};