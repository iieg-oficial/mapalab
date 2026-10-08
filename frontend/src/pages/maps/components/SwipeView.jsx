import { useCallback, useEffect, useRef, useState } from 'react';
import MapView from './MapView';
import Icon from '@components/Icon';
import { useMapsContext } from '@hooks/useMaps';
import { useViewSync } from '@pages/maps/hooks/useViewSync';
import { SLOT_COLORS, SWIPE_HANDLE_COLOR, slotLabel } from '@pages/maps/helpers/swipeTheme';
import {
    SWIPE_HANDLE_MIN,
    SWIPE_HANDLE_MAX,
    SWIPE_KEYBOARD_STEP,
    SWIPE_DEBOUNCE_MS,
    SWIPE_POS_THRESHOLD,
    SWIPE_POS_JITTER,
    SWIPE_INTRO_MS,
    SWIPE_MINIMIZE_MS,
    minimizeTransform,
} from '@pages/maps/helpers/swipeMode';

const OVERLAY_LETTER = 'font-garet font-bold text-white text-[120px] leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]';
const HANDLE_LABEL = 'flex items-center justify-center font-garet text-[18px] font-bold leading-none drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)]';
const FADE_DELAY_MS = Math.round(SWIPE_MINIMIZE_MS * 0.6);

const SwipeView = () => {
    const { compareMode, paneMapInstances, setSwipePosition, highlightedSlots } = useMapsContext();
    const containerRef = useRef(null);
    const [pos, setPos] = useState((compareMode?.swipePosition ?? 0.5) * 100);
    const lastPersistedRef = useRef(pos);
    const externallySetRef = useRef(false);
    const isHorizontal = compareMode?.swipeOrientation === 'horizontal';
    const [intro, setIntro] = useState(true);
    const [visibles, setVisibles] = useState('AB');
    const [minimizando, setMinimizando] = useState(false);
    const [medidas, setMedidas] = useState({ width: 0, height: 0 });
    const minimizandoRef = useRef(false);
    const slots = highlightedSlots ?? (intro ? 'AB' : null);

    useViewSync(paneMapInstances, !!compareMode?.active);

    useEffect(() => {
        const id = setTimeout(() => setIntro(false), SWIPE_INTRO_MS);
        return () => clearTimeout(id);
    }, []);

    useEffect(() => {
        if (slots) {
            minimizandoRef.current = false;
            setVisibles(slots);
            setMinimizando(false);
            return undefined;
        }
        if (!visibles || minimizandoRef.current) return undefined;
        const rect = containerRef.current?.getBoundingClientRect();
        setMedidas({ width: rect?.width || 0, height: rect?.height || 0 });
        minimizandoRef.current = true;
        setMinimizando(true);
        const id = setTimeout(() => {
            minimizandoRef.current = false;
            setVisibles(null);
            setMinimizando(false);
        }, SWIPE_MINIMIZE_MS);
        return () => clearTimeout(id);
    }, [slots, visibles]);

    useEffect(() => {
        const captured = compareMode?.capturedView;
        if (!captured?.center || captured.zoom == null) return;
        const apply = () => {
            const maps = Array.isArray(paneMapInstances) ? paneMapInstances : Object.values(paneMapInstances);
            maps.forEach((m) => {
                if (m) {
                    m.getView().setCenter(captured.center);
                    m.getView().setZoom(captured.zoom);
                }
            });
        };
        apply();
        const id = setTimeout(apply, 50);
        return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paneMapInstances[0], paneMapInstances[1]]);

    useEffect(() => {
        const next = (compareMode?.swipePosition ?? 0.5) * 100;
        setPos(prev => {
            if (Math.abs(next - prev) <= SWIPE_POS_JITTER) return prev;
            externallySetRef.current = true;
            lastPersistedRef.current = next;
            return next;
        });
    }, [compareMode?.swipePosition]);

    useEffect(() => {
        if (externallySetRef.current) {
            externallySetRef.current = false;
            return undefined;
        }
        const handle = setTimeout(() => {
            const fraction = pos / 100;
            if (Math.abs(fraction - lastPersistedRef.current / 100) > SWIPE_POS_THRESHOLD) {
                lastPersistedRef.current = pos;
                setSwipePosition?.(fraction);
            }
        }, SWIPE_DEBOUNCE_MS);
        return () => clearTimeout(handle);
    }, [pos, setSwipePosition]);

    const updatePosFromPointer = useCallback((clientX, clientY) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const value = isHorizontal
            ? ((clientY - rect.top) / rect.height) * 100
            : ((clientX - rect.left) / rect.width) * 100;
        setPos(Math.max(SWIPE_HANDLE_MIN, Math.min(SWIPE_HANDLE_MAX, value)));
    }, [isHorizontal]);

    const onPointerDown = useCallback((e) => {
        e.preventDefault();
        const handleMove = (ev) => updatePosFromPointer(ev.clientX, ev.clientY);
        const handleUp = () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
            window.removeEventListener('pointercancel', handleUp);
        };
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleUp);
    }, [updatePosFromPointer]);

    const onKeyDown = useCallback((e) => {
        const decreaseKey = isHorizontal ? 'ArrowUp' : 'ArrowLeft';
        const increaseKey = isHorizontal ? 'ArrowDown' : 'ArrowRight';
        if (e.key !== decreaseKey && e.key !== increaseKey && e.key !== 'Home' && e.key !== 'End') return;
        e.preventDefault();
        if (e.key === 'Home') return setPos(SWIPE_HANDLE_MIN);
        if (e.key === 'End') return setPos(SWIPE_HANDLE_MAX);
        setPos(prev => {
            const delta = e.key === decreaseKey ? -SWIPE_KEYBOARD_STEP : SWIPE_KEYBOARD_STEP;
            return Math.max(SWIPE_HANDLE_MIN, Math.min(SWIPE_HANDLE_MAX, prev + delta));
        });
    }, [isHorizontal]);

    if (!compareMode?.active) return null;

    const clipPath = isHorizontal ? `inset(${pos}% 0 0 0)` : `inset(0 0 0 ${pos}%)`;
    const handleStyle = isHorizontal
        ? { top: `${pos}%`, height: '14px', marginTop: '-7px', left: 0, right: 0 }
        : { left: `${pos}%`, width: '14px', marginLeft: '-7px', top: 0, bottom: 0 };
    const handleBaseClass = isHorizontal
        ? 'absolute z-[1] cursor-ns-resize touch-none'
        : 'absolute z-[1] cursor-ew-resize touch-none';
    const lineClass = isHorizontal
        ? 'absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] shadow'
        : 'absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] shadow';
    const knobIconName = isHorizontal ? 'swipe_handle_chevrons_h' : 'swipe_handle_chevrons_v';

    const overlayAStyle = isHorizontal
        ? { top: 0, left: 0, right: 0, height: `${pos}%` }
        : { top: 0, bottom: 0, left: 0, width: `${pos}%` };
    const overlayBStyle = isHorizontal
        ? { bottom: 0, left: 0, right: 0, height: `${100 - pos}%` }
        : { top: 0, bottom: 0, right: 0, width: `${100 - pos}%` };

    const panelStyle = (slot, base) => ({
        ...base,
        backgroundColor: minimizando ? 'transparent' : SLOT_COLORS[slot].overlay,
        transition: `background-color ${FADE_DELAY_MS}ms ease`,
    });
    const letraStyle = (slot) => ({
        transform: minimizando
            ? minimizeTransform({ slot, pos, isHorizontal, width: medidas.width, height: medidas.height })
            : 'none',
        opacity: minimizando ? 0 : 1,
        transition: `transform ${SWIPE_MINIMIZE_MS}ms cubic-bezier(0.34, 0.8, 0.3, 1), opacity 180ms linear ${FADE_DELAY_MS}ms`,
    });
    const etiquetaStyle = (slot) => ({
        color: SLOT_COLORS[slot].fg,
        opacity: !visibles || minimizando ? 1 : 0,
        transition: `opacity 200ms ease ${FADE_DELAY_MS}ms`,
    });

    return (
        <div ref={containerRef} data-swipe-composite="true" className="absolute inset-0 overflow-hidden">
            <MapView paneIndex={0} className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0 pointer-events-none" style={{ clipPath }}>
                <MapView paneIndex={1} className="absolute inset-0 w-full h-full pointer-events-auto" />
            </div>
            {(visibles === 'A' || visibles === 'AB') && (
                <div
                    aria-hidden="true"
                    className="absolute z-[1] flex items-center justify-center pointer-events-none"
                    style={panelStyle('A', overlayAStyle)}
                >
                    <span className={OVERLAY_LETTER} style={letraStyle('A')}>{slotLabel('A')}</span>
                </div>
            )}
            {(visibles === 'B' || visibles === 'AB') && (
                <div
                    aria-hidden="true"
                    className="absolute z-[1] flex items-center justify-center pointer-events-none"
                    style={panelStyle('B', overlayBStyle)}
                >
                    <span className={OVERLAY_LETTER} style={letraStyle('B')}>{slotLabel('B')}</span>
                </div>
            )}
            <div
                onPointerDown={onPointerDown}
                onKeyDown={onKeyDown}
                tabIndex={0}
                role="slider"
                aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
                aria-label={`Posición del comparador: ${Math.round(pos)}%. Usa flechas para mover.`}
                aria-valuenow={Math.round(pos)}
                aria-valuemin={SWIPE_HANDLE_MIN}
                aria-valuemax={SWIPE_HANDLE_MAX}
                className={`${handleBaseClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8300] focus-visible:ring-offset-2`}
                style={handleStyle}
            >
                <div className={lineClass} style={{ backgroundColor: SWIPE_HANDLE_COLOR }} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 ${isHorizontal ? 'flex-col' : ''}`}>
                    <span aria-hidden="true" className={HANDLE_LABEL} style={etiquetaStyle('A')}>{slotLabel('A')}</span>
                    <div
                        className="shrink-0 w-9 h-9 rounded-full shadow-lg flex items-center justify-center"
                        style={{ backgroundColor: SWIPE_HANDLE_COLOR }}
                    >
                        <Icon name={knobIconName} className="w-5 h-5" />
                    </div>
                    <span aria-hidden="true" className={HANDLE_LABEL} style={etiquetaStyle('B')}>{slotLabel('B')}</span>
                </div>
            </div>
        </div>
    );
};

export default SwipeView;
