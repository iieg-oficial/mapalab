import { useCallback, useEffect, useRef, useState } from 'react';
import MapView from './MapView';
import { useMapsContext } from '@hooks/useMaps';
import { useViewSync } from '@pages/maps/hooks/useViewSync';

const SwipeView = () => {
    const { compareMode, paneMapRefs, setSwipePosition, highlightedSlots } = useMapsContext();
    const containerRef = useRef(null);
    const [pos, setPos] = useState((compareMode?.swipePosition ?? 0.5) * 100);
    const lastPersistedRef = useRef(pos);
    const isHorizontal = compareMode?.swipeOrientation === 'horizontal';
    const showA = highlightedSlots === 'A' || highlightedSlots === 'AB';
    const showB = highlightedSlots === 'B' || highlightedSlots === 'AB';

    useViewSync(paneMapRefs, !!compareMode?.active);

    useEffect(() => {
        const next = (compareMode?.swipePosition ?? 0.5) * 100;
        setPos(prev => (Math.abs(next - prev) > 0.1 ? next : prev));
    }, [compareMode?.swipePosition]);

    useEffect(() => {
        const handle = setTimeout(() => {
            const fraction = pos / 100;
            if (Math.abs(fraction - lastPersistedRef.current / 100) > 0.005) {
                lastPersistedRef.current = pos;
                setSwipePosition?.(fraction);
            }
        }, 200);
        return () => clearTimeout(handle);
    }, [pos, setSwipePosition]);

    const updatePosFromPointer = useCallback((clientX, clientY) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const value = isHorizontal
            ? ((clientY - rect.top) / rect.height) * 100
            : ((clientX - rect.left) / rect.width) * 100;
        setPos(Math.max(5, Math.min(95, value)));
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

    if (!compareMode?.active) return null;

    const clipPath = isHorizontal ? `inset(${pos}% 0 0 0)` : `inset(0 0 0 ${pos}%)`;
    const handleStyle = isHorizontal
        ? { top: `${pos}%`, height: '14px', marginTop: '-7px', left: 0, right: 0 }
        : { left: `${pos}%`, width: '14px', marginLeft: '-7px', top: 0, bottom: 0 };
    const handleBaseClass = isHorizontal
        ? 'absolute z-[1] cursor-ns-resize touch-none'
        : 'absolute z-[1] cursor-ew-resize touch-none';
    const lineClass = isHorizontal
        ? 'absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#FF8300] shadow'
        : 'absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-[#FF8300] shadow';
    const knobIcon = isHorizontal
        ? <><polyline points="6 9 12 3 18 9" /><polyline points="18 15 12 21 6 15" /></>
        : <><polyline points="9 18 3 12 9 6" /><polyline points="15 6 21 12 15 18" /></>;

    const overlayAStyle = isHorizontal
        ? { top: 0, left: 0, right: 0, height: `${pos}%` }
        : { top: 0, bottom: 0, left: 0, width: `${pos}%` };
    const overlayBStyle = isHorizontal
        ? { bottom: 0, left: 0, right: 0, height: `${100 - pos}%` }
        : { top: 0, bottom: 0, right: 0, width: `${100 - pos}%` };

    return (
        <div ref={containerRef} data-swipe-composite="true" className="absolute inset-0 overflow-hidden">
            <MapView paneIndex={0} className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0 pointer-events-none" style={{ clipPath }}>
                <MapView paneIndex={1} className="absolute inset-0 w-full h-full pointer-events-auto" />
            </div>
            {showA && (
                <div className="absolute z-[1] flex items-center justify-center pointer-events-none transition-opacity duration-200 bg-[#5C2472]/10" style={overlayAStyle}>
                    <span className="font-garet font-bold text-white text-[120px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]">A</span>
                </div>
            )}
            {showB && (
                <div className="absolute z-[1] flex items-center justify-center pointer-events-none transition-opacity duration-200 bg-[#FF8300]/10" style={overlayBStyle}>
                    <span className="font-garet font-bold text-white text-[120px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]">B</span>
                </div>
            )}
            <div
                onPointerDown={onPointerDown}
                role="separator"
                aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
                aria-valuenow={Math.round(pos)}
                aria-valuemin={5}
                aria-valuemax={95}
                className={handleBaseClass}
                style={handleStyle}
            >
                <div className={lineClass} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-[#FF8300] rounded-full shadow-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        {knobIcon}
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default SwipeView;
