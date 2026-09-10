import { useState, useEffect, useRef, useCallback } from 'react';
import { debugStore } from '@services/analyticsDebugStore';
import { useIsAnalyticsPanelOpen } from '@hooks/useDevTools';

const AnalyticsDebugPanel = () => {
    const isPanelOpen = useIsAnalyticsPanelOpen();
    const [events, setEvents] = useState(debugStore.getEvents());
    const [collapsed, setCollapsed] = useState(false);
    const [position, setPosition] = useState({ x: 16, y: window.innerHeight - 80 });
    const dragRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => debugStore.subscribe(setEvents), []);

    const handlePointerDown = useCallback((e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        e.preventDefault();
        const rect = panelRef.current.getBoundingClientRect();
        dragRef.current = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
        document.body.style.userSelect = 'none';
    }, []);

    useEffect(() => {
        const handlePointerMove = (e) => {
            if (!dragRef.current) return;
            setPosition({
                x: e.clientX - dragRef.current.offsetX,
                y: e.clientY - dragRef.current.offsetY
            });
        };
        const handlePointerUp = () => {
            dragRef.current = null;
            document.body.style.userSelect = '';
        };
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, []);

    if (!isPanelOpen || window.innerWidth < 768) return null;

    return (
        <div
            ref={panelRef}
            onPointerDown={handlePointerDown}
            className="fixed z-[9999] font-mono text-xs select-none cursor-grab active:cursor-grabbing"
            style={{ left: position.x, top: position.y }}
        >
            <div className="bg-gray-900 text-white rounded-xl shadow-2xl w-72">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <span className="text-white text-[10px] cursor-grab active:cursor-grabbing">⠿</span>
                        <span className="font-bold text-green-400">Analytics Debug</span>
                    </div>
                    <button
                        onClick={() => setCollapsed(p => !p)}
                        className="text-gray-400 hover:text-white transition-colors px-1"
                    >
                        {events.length} eventos {collapsed ? '▲' : '▼'}
                    </button>
                </div>
                {!collapsed && (
                    <div className="max-h-64 overflow-y-auto rounded-b-xl">
                        {events.length === 0 ? (
                            <p className="text-gray-500 px-3 py-3 text-center">Sin eventos aún</p>
                        ) : (
                            [...events].reverse().map((e, i) => (
                                <div key={i} className="px-3 py-1.5 border-b border-gray-800 last:border-0">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-yellow-400 font-semibold">{e.event}</span>
                                        <span className="text-gray-500 text-[10px]">{e.time.toLocaleTimeString('es-MX')}</span>
                                    </div>
                                    {Object.keys(e.params).length > 0 && (
                                        <div className="text-[10px] mt-0.5 flex flex-wrap gap-x-2">
                                            {Object.entries(e.params).map(([k, v]) => (
                                                <span key={k} className="text-gray-400">
                                                    {k}: <span className="text-blue-300">{String(v)}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDebugPanel;
