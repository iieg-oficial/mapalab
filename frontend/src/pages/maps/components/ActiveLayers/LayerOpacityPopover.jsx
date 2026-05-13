import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Bar from '@components/Bar';
import { trackOpacityChange } from '@services/analyticsService';

const POPOVER_WIDTH = 220;
const VIEWPORT_MARGIN = 8;
const TRACK_DEBOUNCE_MS = 500;

const LayerOpacityPopover = ({ anchorRef, value, onChange, onClose, layerId }) => {
    const ref = useRef(null);
    const trackTimerRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const percent = Math.round((value ?? 1) * 100);

    const handleChange = (next) => {
        onChange?.(next);
        if (trackTimerRef.current) clearTimeout(trackTimerRef.current);
        trackTimerRef.current = setTimeout(() => {
            trackOpacityChange(layerId, next);
        }, TRACK_DEBOUNCE_MS);
    };

    useEffect(() => () => {
        if (trackTimerRef.current) clearTimeout(trackTimerRef.current);
    }, []);

    useLayoutEffect(() => {
        const updatePosition = () => {
            const anchor = anchorRef?.current;
            if (!anchor) return;
            const rect = anchor.getBoundingClientRect();
            const left = Math.max(
                VIEWPORT_MARGIN,
                Math.min(window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN, rect.right - POPOVER_WIDTH)
            );
            setPosition({ top: rect.bottom + 4, left });
        };
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [anchorRef]);

    useEffect(() => {
        const handleOutside = (e) => {
            const target = e.target;
            if (ref.current?.contains(target)) return;
            if (anchorRef?.current?.contains(target)) return;
            onClose?.();
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [anchorRef, onClose]);

    useEffect(() => {
        const node = ref.current;
        if (!node) return undefined;
        const stop = (e) => e.stopPropagation();
        node.addEventListener('mousedown', stop);
        node.addEventListener('click', stop);
        return () => {
            node.removeEventListener('mousedown', stop);
            node.removeEventListener('click', stop);
        };
    }, []);

    return createPortal(
        <div
            ref={ref}
            className="fixed z-[9999] bg-white rounded-[8px] shadow-[0px_3px_24px_#00000029] px-3 py-2.5"
            style={{ top: position.top, left: position.left, width: POPOVER_WIDTH }}
        >
            <Bar
                min={0}
                max={100}
                value={percent}
                onChange={(e) => handleChange(parseInt(e.target.value, 10) / 100)}
            />
        </div>,
        document.body
    );
};

export default LayerOpacityPopover;
