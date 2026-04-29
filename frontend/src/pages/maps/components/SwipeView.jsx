import { useEffect, useRef, useState } from 'react';
import MapView from './MapView';
import { useMapsContext } from '@hooks/useMaps';
import { useViewSync } from '@pages/maps/hooks/useViewSync';

const SwipeView = () => {
    const { compareMode, paneMapRefs, setSwipePosition } = useMapsContext();
    const containerRef = useRef(null);
    const draggingRef = useRef(false);
    const [pos, setPos] = useState((compareMode?.swipePosition ?? 0.5) * 100);
    const lastPersistedRef = useRef(pos);

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

    if (!compareMode?.active) return null;

    const onPointerDown = (e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e) => {
        if (!draggingRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        setPos(Math.max(5, Math.min(95, x)));
    };
    const onPointerUp = (e) => {
        draggingRef.current = false;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
    };

    const labelA = compareMode.paneA.label || 'A';
    const labelB = compareMode.paneB.label || 'B';

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden">
            <MapView paneIndex={0} className="absolute inset-0 w-full h-full" />
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
            >
                <MapView paneIndex={1} className="absolute inset-0 w-full h-full pointer-events-auto" />
            </div>
            <div
                className="absolute top-3 left-4 z-10 px-3 py-1 bg-white/90 border border-gray-300 rounded-full text-xs font-medium text-gray-700 shadow pointer-events-none"
            >
                {labelA}
            </div>
            <div
                className="absolute top-3 right-4 z-10 px-3 py-1 bg-white/90 border border-gray-300 rounded-full text-xs font-medium text-gray-700 shadow pointer-events-none"
            >
                {labelB}
            </div>
            <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                role="separator"
                aria-orientation="vertical"
                aria-valuenow={Math.round(pos)}
                aria-valuemin={5}
                aria-valuemax={95}
                className="absolute top-0 bottom-0 z-10 cursor-ew-resize touch-none"
                style={{ left: `${pos}%`, width: '14px', marginLeft: '-7px' }}
            >
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-[#FF8300] shadow" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-[#FF8300] rounded-full shadow-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <polyline points="9 18 3 12 9 6" />
                        <polyline points="15 6 21 12 15 18" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default SwipeView;
