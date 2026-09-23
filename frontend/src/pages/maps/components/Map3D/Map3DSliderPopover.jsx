import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Bar from '@components/Bar';

const POPOVER_WIDTH = 210;
const VIEWPORT_MARGIN = 8;

const Map3DSliderPopover = ({ anchorRef, titulo, valor, texto, min, max, step, onChange, onClose }) => {
    const ref = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const inputId = `view3d-${titulo.toLowerCase()}`;

    useLayoutEffect(() => {
        const updatePosition = () => {
            const anchor = anchorRef?.current;
            if (!anchor) return;
            const rect = anchor.getBoundingClientRect();
            const left = Math.min(window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN, rect.right + 12);
            setPosition({ top: rect.top + rect.height / 2, left: Math.max(VIEWPORT_MARGIN, left) });
        };
        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [anchorRef]);

    useEffect(() => {
        const handleOutside = (event) => {
            if (ref.current?.contains(event.target)) return;
            if (anchorRef?.current?.contains(event.target)) return;
            onClose?.();
        };
        const handleEscape = (event) => {
            if (event.key === 'Escape') onClose?.();
        };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [anchorRef, onClose]);

    return createPortal(
        <div
            ref={ref}
            className="fixed z-[9999] bg-white rounded-[10px] shadow-[0px_3px_24px_#00000029] px-3 py-2.5 flex flex-col gap-2"
            style={{ top: position.top, left: position.left, width: POPOVER_WIDTH, transform: 'translateY(-50%)' }}
        >
            <label htmlFor={inputId} className="flex justify-between text-[12px] text-[#465055]">
                {titulo}
                <span className="font-semibold tabular-nums text-[#1A1A1A]">{texto}</span>
            </label>
            <Bar
                id={inputId}
                min={min}
                max={max}
                step={step}
                value={valor}
                onChange={(event) => onChange(Number(event.target.value))}
                aria-label={titulo}
            />
        </div>,
        document.body
    );
};

export default Map3DSliderPopover;
