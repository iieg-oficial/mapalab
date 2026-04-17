import { useRef, useState } from 'react';

const THRESHOLD = 100;
const MAX_OPACITY_FADE = 0.6;

const SwipeToRemove = ({ onRemove, children, className = '' }) => {
    const [dragX, setDragX] = useState(0);
    const [animate, setAnimate] = useState(false);
    const startRef = useRef({ x: 0, y: 0, active: false, committed: false });

    const reset = () => {
        setAnimate(true);
        setDragX(0);
        startRef.current.committed = false;
        setTimeout(() => setAnimate(false), 250);
    };

    const handleTouchStart = (e) => {
        const t = e.touches[0];
        startRef.current = { x: t.clientX, y: t.clientY, active: true, committed: false };
        setAnimate(false);
    };

    const handleTouchMove = (e) => {
        if (!startRef.current.active) return;
        const t = e.touches[0];
        const dx = t.clientX - startRef.current.x;
        const dy = t.clientY - startRef.current.y;

        if (!startRef.current.committed) {
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
            if (Math.abs(dy) > Math.abs(dx)) {
                startRef.current.active = false;
                return;
            }
            startRef.current.committed = true;
        }

        setDragX(dx);
    };

    const handleTouchEnd = () => {
        if (!startRef.current.active || !startRef.current.committed) {
            startRef.current.active = false;
            return;
        }
        startRef.current.active = false;

        if (Math.abs(dragX) > THRESHOLD) {
            setAnimate(true);
            setDragX(dragX > 0 ? window.innerWidth : -window.innerWidth);
            setTimeout(() => {
                onRemove?.();
            }, 220);
        } else {
            reset();
        }
    };

    const absX = Math.abs(dragX);
    const opacity = 1 - Math.min(absX / (THRESHOLD * 2), MAX_OPACITY_FADE);
    const pastThreshold = absX > THRESHOLD;
    const label = pastThreshold ? 'Eliminando…' : 'Desliza para eliminar';
    const showIndicator = startRef.current.committed && absX > 10;

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={reset}
            className="relative"
            style={{ touchAction: 'pan-y' }}
        >
            {showIndicator && (
                <div
                    className={`
                        absolute inset-0 flex items-center pointer-events-none
                        font-garet font-bold text-[11px] transition-colors
                        ${dragX > 0 ? 'justify-start pl-5' : 'justify-end pr-5'}
                        ${pastThreshold ? 'text-[#FF577D]' : 'text-[#8A9199]'}
                    `}
                >
                    {label}
                </div>
            )}
            <div
                className={`relative ${className}`}
                style={{
                    transform: `translateX(${dragX}px)`,
                    opacity,
                    transition: animate ? 'transform 0.22s ease-out, opacity 0.22s ease-out' : 'none'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default SwipeToRemove;
