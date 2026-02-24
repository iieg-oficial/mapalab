import { useState, useEffect } from 'react';
import { debugStore } from '@services/analyticsDebugStore';

const isDev = import.meta.env.VITE_NODE_ENV === 'development';

const AnalyticsDebugPanel = () => {
    const [events, setEvents] = useState(debugStore.getEvents());
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => debugStore.subscribe(setEvents), []);

    if (!isDev) return null;

    return (
        <div className="fixed bottom-4 left-4 z-[9999] font-mono text-xs select-none">
            <div className="bg-gray-900 text-white rounded-xl shadow-2xl w-72">
                <button
                    onClick={() => setCollapsed(p => !p)}
                    className="w-full flex items-center justify-between px-3 py-2 border-b border-gray-700 rounded-t-xl hover:bg-gray-800 transition-colors"
                >
                    <span className="font-bold text-green-400">Analytics Debug</span>
                    <span className="text-gray-400">{events.length} eventos {collapsed ? '▲' : '▼'}</span>
                </button>
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
