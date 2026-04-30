import { useEffect, useRef, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';

const SLOT_COLOR = { A: '#5C2472', B: '#FF8300' };

const SwipeSlotFlash = () => {
    const { compareMode } = useMapsContext();
    const [phase, setPhase] = useState('hidden');
    const lastSlotRef = useRef(compareMode?.activeSlot);
    const timersRef = useRef([]);

    useEffect(() => {
        if (!compareMode?.active) {
            lastSlotRef.current = compareMode?.activeSlot;
            return;
        }
        if (compareMode.activeSlot === lastSlotRef.current) return;
        lastSlotRef.current = compareMode.activeSlot;
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
        setPhase('visible');
        timersRef.current.push(setTimeout(() => setPhase('fading'), 350));
        timersRef.current.push(setTimeout(() => setPhase('hidden'), 700));
    }, [compareMode?.active, compareMode?.activeSlot]);

    useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

    if (!compareMode?.active || phase === 'hidden') return null;
    const slot = compareMode.activeSlot;
    const color = SLOT_COLOR[slot] || '#465055';
    const opacityClass = phase === 'visible' ? 'opacity-100' : 'opacity-0';

    return (
        <div className={`fixed inset-0 z-30 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${opacityClass}`}>
            <div
                className="size-32 rounded-full flex items-center justify-center text-white font-garet font-bold text-[80px] shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
                style={{ backgroundColor: color }}
            >
                {slot}
            </div>
        </div>
    );
};

export default SwipeSlotFlash;
