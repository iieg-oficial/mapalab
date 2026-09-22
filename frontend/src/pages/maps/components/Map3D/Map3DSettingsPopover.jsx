import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Bar from '@components/Bar';
import { useView3d } from '@contexts/View3dContext';
import { VIEW3D_EXAGGERATION_RANGE, VIEW3D_PITCH_MAX } from '@pages/maps/helpers/view3d';

const POPOVER_WIDTH = 220;
const VIEWPORT_MARGIN = 8;

const Map3DSettingsPopover = ({ anchorRef, onClose }) => {
    const ref = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const { pitch, exaggeration, setPitch, setExaggeration } = useView3d();

    useLayoutEffect(() => {
        const updatePosition = () => {
            const anchor = anchorRef?.current;
            if (!anchor) return;
            const rect = anchor.getBoundingClientRect();
            const left = Math.min(window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN, rect.left);
            setPosition({ top: rect.top - 8, left: Math.max(VIEWPORT_MARGIN, left) });
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
            className="fixed z-[9999] bg-white rounded-[8px] shadow-[0px_3px_24px_#00000029] px-3 py-2.5 flex flex-col gap-3"
            style={{ top: position.top, left: position.left, width: POPOVER_WIDTH, transform: 'translateY(-100%)' }}
        >
            <label htmlFor="view3d-inclinacion" className="flex flex-col gap-1.5 text-[12px] text-[#465055]">
                <span className="flex justify-between">
                    Inclinación
                    <span className="font-semibold tabular-nums text-[#1A1A1A]">{Math.round(pitch)}°</span>
                </span>
                <Bar
                    id="view3d-inclinacion"
                    min={0}
                    max={VIEW3D_PITCH_MAX}
                    value={Math.round(pitch)}
                    onChange={(event) => setPitch(Number(event.target.value))}
                    aria-label="Inclinación"
                />
            </label>
            <label htmlFor="view3d-relieve" className="flex flex-col gap-1.5 text-[12px] text-[#465055]">
                <span className="flex justify-between">
                    Relieve
                    <span className="font-semibold tabular-nums text-[#1A1A1A]">×{exaggeration}</span>
                </span>
                <Bar
                    id="view3d-relieve"
                    min={VIEW3D_EXAGGERATION_RANGE[0]}
                    max={VIEW3D_EXAGGERATION_RANGE[1]}
                    step={0.5}
                    value={exaggeration}
                    onChange={(event) => setExaggeration(Number(event.target.value))}
                    aria-label="Exageración del relieve"
                />
            </label>
        </div>,
        document.body
    );
};

export default Map3DSettingsPopover;
