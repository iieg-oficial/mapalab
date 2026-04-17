import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Overlay from 'ol/Overlay';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const ROTATE_STEP = Math.PI / 4;
const SCALE_STEP = 0.25;
const SCALE_MIN = 0.5;
const SCALE_MAX = 3;

const baseBtn = 'size-7 flex items-center justify-center rounded-full border border-transparent transition-colors cursor-pointer';
const purpleHover = 'hover:border-[#70308A] hover:bg-[#F9FBFF]';
const pinkHover = 'hover:border-[#FF577D] hover:bg-[#F9FBFF]';

const FeatureEditToolbar = ({
    mapRef,
    feature,
    selectionTick,
    onRotate,
    onScale,
    onDelete,
    onClose
}) => {
    const elementRef = useRef(null);
    const overlayRef = useRef(null);

    if (!elementRef.current && typeof document !== 'undefined') {
        const el = document.createElement('div');
        el.style.pointerEvents = 'auto';
        elementRef.current = el;
    }

    const [, forceRerender] = useState(0);
    useEffect(() => {
        forceRerender(v => v + 1);
    }, [selectionTick]);

    useEffect(() => {
        const map = mapRef?.current;
        if (!map || !feature || !elementRef.current) return;

        const overlay = new Overlay({
            element: elementRef.current,
            positioning: 'bottom-center',
            offset: [0, -28],
            stopEvent: true,
            insertFirst: false
        });

        const geom = feature.getGeometry();
        if (geom) overlay.setPosition(geom.getCoordinates());

        map.addOverlay(overlay);
        overlayRef.current = overlay;

        const syncPosition = () => {
            const g = feature.getGeometry();
            if (g) overlay.setPosition(g.getCoordinates());
        };
        feature.on('change', syncPosition);

        return () => {
            feature.un('change', syncPosition);
            map.removeOverlay(overlay);
            overlayRef.current = null;
        };
    }, [mapRef, feature]);

    const currentRotation = feature?.get('rotation') ?? 0;
    const currentScale = feature?.get('scale') ?? 1;

    const content = useMemo(() => {
        const rotateLeft = () => onRotate?.(currentRotation - ROTATE_STEP);
        const rotateRight = () => onRotate?.(currentRotation + ROTATE_STEP);
        const scaleDown = () => onScale?.(Math.max(SCALE_MIN, +(currentScale - SCALE_STEP).toFixed(2)));
        const scaleUp = () => onScale?.(Math.min(SCALE_MAX, +(currentScale + SCALE_STEP).toFixed(2)));

        return (
            <div
                className="flex items-center gap-1 px-2 py-2 bg-[#F9FBFF] rounded-[12px] shadow-[0_5px_20px_#1A26641A] border border-[#E6E9F0]"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
            >
                <Tooltip content="Rotar −45°" delay={500}>
                    <button type="button" onClick={rotateLeft} className={`${baseBtn} ${purpleHover}`} aria-label="Rotar a la izquierda">
                        <Icon name="undo" className="size-4 text-[#465055]" />
                    </button>
                </Tooltip>
                <Tooltip content="Rotar +45°" delay={500}>
                    <button type="button" onClick={rotateRight} className={`${baseBtn} ${purpleHover}`} aria-label="Rotar a la derecha">
                        <span className="inline-flex scale-x-[-1]">
                            <Icon name="undo" className="size-4 text-[#465055]" />
                        </span>
                    </button>
                </Tooltip>

                <div className="w-px h-5 bg-[#E6E9F0] mx-1" />

                <Tooltip content="Reducir tamaño" delay={500}>
                    <button type="button" onClick={scaleDown} className={`${baseBtn} ${purpleHover}`} aria-label="Reducir tamaño">
                        <span className="font-garet font-bold text-[16px] text-[#465055] leading-none pb-0.5">−</span>
                    </button>
                </Tooltip>
                <Tooltip content="Aumentar tamaño" delay={500}>
                    <button type="button" onClick={scaleUp} className={`${baseBtn} ${purpleHover}`} aria-label="Aumentar tamaño">
                        <span className="font-garet font-bold text-[16px] text-[#465055] leading-none">+</span>
                    </button>
                </Tooltip>

                <div className="w-px h-5 bg-[#E6E9F0] mx-1" />

                <Tooltip content="Eliminar" delay={500}>
                    <button type="button" onClick={onDelete} className={`${baseBtn} ${pinkHover}`} aria-label="Eliminar">
                        <Icon name="eliminar" state="hover" className="size-4" />
                    </button>
                </Tooltip>
                <Tooltip content="Listo" delay={500}>
                    <button type="button" onClick={onClose} className={`${baseBtn} ${purpleHover}`} aria-label="Terminar edicion">
                        <Icon name="done" className="size-4 text-[#465055]" />
                    </button>
                </Tooltip>
            </div>
        );
    }, [currentRotation, currentScale, onRotate, onScale, onDelete, onClose]);

    if (!feature || !elementRef.current) return null;
    return createPortal(content, elementRef.current);
};

export default FeatureEditToolbar;
