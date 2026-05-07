import { useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';
import Badge from '@components/Badge';
import Tooltip from '@components/Tooltip';

const tools = [
    {
        id: 'mediciones',
        label: 'Mediciones',
        description: 'Punto, linea, poligono, texto',
        icon: (
            <svg viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
                <path d="M8 42L42 8" />
                <path d="M14 42l-6 6" />
                <path d="M22 36l-3 3" />
                <path d="M28 30l-3 3" />
                <path d="M34 24l-3 3" />
                <path d="M40 18l-3 3" />
                <circle cx="48" cy="48" r="3" fill="currentColor" />
            </svg>
        ),
    },
    {
        id: 'compare-swipe',
        label: 'Barra divisora',
        description: 'Swipe vertical',
        beta: true,
        icon: (
            <svg viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
                <rect x="6" y="12" width="48" height="36" rx="2" />
                <line x1="30" y1="8" x2="30" y2="52" strokeWidth="3" stroke="#FF8300" />
                <path d="M22 30l-4-4M22 30l-4 4M38 30l4-4M38 30l4 4" stroke="#FF8300" />
            </svg>
        ),
    },
];

const ToolsMenu = ({ close, closeButton, toggleMeasurementTools, areMeasurementToolsVisible }) => {
    const { compareMode, exitCompareMode, enterCompareMode } = useMapsContext();
    const { closeSider } = useSider();
    const [hoveredId, setHoveredId] = useState(null);

    const startSwipe = () => {
        enterCompareMode();
        close?.();
        closeSider?.();
    };

    const handleClick = (id) => {
        if (id === 'mediciones') {
            toggleMeasurementTools?.();
            return;
        }
        if (id === 'compare-swipe') {
            if (compareMode?.active) {
                exitCompareMode();
                return;
            }
            startSwipe();
        }
    };

    const isActive = (id) => {
        if (id === 'mediciones') return !!areMeasurementToolsVisible;
        if (id === 'compare-swipe') return !!compareMode?.active;
        return false;
    };

    return (
        <>
            <div className="py-6 px-4">
                <div className="flex items-center justify-between">
                    <h3 className="block text-[18px]/[47px] font-garet font-bold mb-2 text-[#5C2472] tracking-normal">
                    Herramientas
                    </h3>
                    {closeButton}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {tools.map(tool => {
                        const active = isActive(tool.id);
                        const hovered = hoveredId === tool.id;
                        const tooltipContent = tool.id === 'compare-swipe' ? (
                            <div className="flex flex-col gap-1.5 max-w-[240px]">
                                <span className="font-bold">{tool.label}</span>
                                <span className="text-[11px] opacity-90">Compara dos mapas con barra divisora. Empieza con los dos slots <span className="font-bold">vacíos</span>; tus capas actuales se guardan y vuelven al cerrar.</span>
                                <span className="text-[11px] opacity-90">Agrega capas en cada slot (A o B) <span className="font-bold">una por una</span> para mejor rendimiento.</span>
                            </div>
                        ) : tool.label;
                        return (
                            <Tooltip key={tool.id} content={tooltipContent} placement="bottom" delay={300}>
                                <button
                                    type="button"
                                    onClick={() => handleClick(tool.id)}
                                    onMouseEnter={() => setHoveredId(tool.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    className={`
                                    relative flex flex-col items-center justify-center gap-2 cursor-pointer
                                    w-[138px] h-[142px] p-3 rounded-[9px] bg-transparent border
                                    ${active ? 'border-[#70308A]' : 'border-transparent hover:border-[#70308A]'}
                                `}
                                >
                                    {tool.beta && (
                                        <Badge
                                            variant="pill"
                                            color="orange"
                                            text="BETA"
                                            className="absolute top-2 right-2"
                                        />
                                    )}
                                    <div className={`flex items-center justify-center ${active || hovered ? 'text-[#5C2472]' : 'text-[#465055]'}`}>
                                        {tool.icon}
                                    </div>
                                    <span className={`text-[12px]/[18px] font-garet text-center ${active ? 'font-bold text-[#5C2472]' : 'font-medium text-[#465055]'}`}>
                                        {tool.label}
                                    </span>
                                </button>
                            </Tooltip>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default ToolsMenu;
