import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SiderContext } from '@contexts/SiderContext';

const DEFAULT_GAP = 10;
const DEFAULT_CLOSE_DELAY_MS = 120;

export const useHoverPopover = ({
    gap = DEFAULT_GAP,
    closeDelay = DEFAULT_CLOSE_DELAY_MS,
    lockSiderHover = true,
} = {}) => {
    const sider = useContext(SiderContext);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const anchorRef = useRef(null);
    const closeTimerRef = useRef(null);

    useLayoutEffect(() => {
        if (!open) return undefined;
        const updatePosition = () => {
            const anchor = anchorRef.current;
            if (!anchor) return;
            const rect = anchor.getBoundingClientRect();
            setPosition({ top: rect.top + rect.height / 2, left: rect.right + gap });
        };
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, gap]);

    useEffect(() => {
        if (!open || !lockSiderHover || !sider?.lockHover) return undefined;
        sider.lockHover();
        return () => sider.unlockHover();
    }, [open, lockSiderHover, sider]);

    useEffect(() => () => clearTimeout(closeTimerRef.current), []);

    const cancelClose = () => clearTimeout(closeTimerRef.current);

    const hoverProps = {
        onMouseEnter: () => {
            cancelClose();
            setOpen(true);
        },
        onMouseLeave: () => {
            cancelClose();
            closeTimerRef.current = setTimeout(() => setOpen(false), closeDelay);
        },
    };

    const close = () => {
        cancelClose();
        setOpen(false);
    };

    return { open, position, anchorRef, hoverProps, close };
};
