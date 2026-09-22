import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Switch from '@components/Switch';
import { useView3d } from '@contexts/View3dContext';

const POPOVER_WIDTH = 214;
const VIEWPORT_MARGIN = 8;

const Fila = ({ etiqueta, descripcion, activo, onChange }) => (
    <div className="flex items-center justify-between gap-3">
        <span className="flex flex-col">
            <span className="text-[13px] text-[#1A1A1A]">{etiqueta}</span>
            <span className="text-[11px] text-[#7b8388]">{descripcion}</span>
        </span>
        <Switch checked={activo} onChange={onChange} tooltip={etiqueta} />
    </div>
);

const Map3DAjustes = ({ anchorRef, onClose }) => {
    const ref = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const { cielo, terreno, orbita, setCielo, setTerreno, setOrbita } = useView3d();

    useLayoutEffect(() => {
        const updatePosition = () => {
            const anchor = anchorRef?.current;
            if (!anchor) return;
            const rect = anchor.getBoundingClientRect();
            const left = Math.min(window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN, rect.left - 12);
            setPosition({ top: rect.top - 10, left: Math.max(VIEWPORT_MARGIN, left) });
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
        const handleEscape = (event) => { if (event.key === 'Escape') onClose?.(); };
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
            className="fixed z-[9999] bg-white rounded-[10px] shadow-[0px_3px_24px_#00000029] px-3 py-3 flex flex-col gap-3"
            style={{ top: position.top, left: position.left, width: POPOVER_WIDTH, transform: 'translateY(-100%)' }}
        >
            <Fila
                etiqueta="Terreno"
                descripcion="Relieve bajo las capas"
                activo={terreno}
                onChange={setTerreno}
            />
            <Fila
                etiqueta="Cielo y neblina"
                descripcion="Horizonte y profundidad"
                activo={cielo}
                onChange={setCielo}
            />
            <Fila
                etiqueta="Órbita"
                descripcion="Gira alrededor del centro"
                activo={orbita}
                onChange={setOrbita}
            />
        </div>,
        document.body
    );
};

export default Map3DAjustes;
