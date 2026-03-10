import { useCallback, useLayoutEffect } from 'react';
import { useSider } from '@contexts/SiderContext';
import { SIDER_TRANSITION_CSS } from '@constants/sider';

export const useFloatingPosition = ({ open, anchorRef, contentRef, placement = 'bottom-start', offset = 8 }) => {
    const { width: siderWidth, isMobile } = useSider();

    const updatePosition = useCallback(() => {
        if (!anchorRef.current || !contentRef.current) return;

        const anchor = anchorRef.current.getBoundingClientRect();
        const el = contentRef.current;

        if (!el.style.transition) {
            el.style.transition = SIDER_TRANSITION_CSS;
        }

        if (isMobile) {
            const top = anchor.bottom + offset;
            const maxTop = window.innerHeight - el.offsetHeight - 8;
            el.style.top = Math.max(8, Math.min(top, maxTop)) + 'px';
            el.style.left = '1rem';
            el.style.right = '1rem';
            el.style.width = 'auto';
            return;
        }

        const placements = {
            'bottom-start': () => ({ top: anchor.bottom + offset, left: anchor.left }),
            'bottom-end':   () => ({ top: anchor.bottom + offset, left: anchor.right - el.offsetWidth }),
            'top-start':    () => ({ top: anchor.top - el.offsetHeight - offset, left: anchor.left }),
            'top-end':      () => ({ top: anchor.top - el.offsetHeight - offset, left: anchor.right - el.offsetWidth }),
            'right-start':  () => ({ top: anchor.top, left: anchor.right + offset }),
            'right-end':    () => ({ top: anchor.bottom - el.offsetHeight, left: anchor.right + offset }),
            'left-start':   () => ({ top: anchor.top, left: anchor.left - el.offsetWidth - offset }),
            'left-end':     () => ({ top: anchor.bottom - el.offsetHeight, left: anchor.left - el.offsetWidth - offset }),
        };

        const compute = placements[placement] ?? placements['bottom-start'];
        const { top, left } = compute();

        const maxLeft = window.innerWidth - el.offsetWidth - 8;
        const maxTop = window.innerHeight - el.offsetHeight - 8;

        el.style.top = Math.max(8, Math.min(top, maxTop)) + 'px';
        el.style.left = Math.max(8, Math.min(left, maxLeft)) + 'px';
        el.style.right = '';
        el.style.width = '';
    }, [anchorRef, contentRef, placement, offset, isMobile]);

    useLayoutEffect(() => {
        if (!open) return;
        updatePosition();
    }, [open, siderWidth, updatePosition]);

    useLayoutEffect(() => {
        if (!open || !anchorRef.current || !contentRef.current) return;

        let rafId = null;
        const handleUpdate = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updatePosition);
        };

        const resizeObserver = new ResizeObserver(handleUpdate);
        resizeObserver.observe(anchorRef.current);

        window.addEventListener('resize', handleUpdate, { passive: true });

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleUpdate);
        };
    }, [open, anchorRef, contentRef, updatePosition]);
};
