import { useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';
import Badge from '@components/Badge';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const IS_NON_PROD = ['dev', 'beta'].includes(import.meta.env.VITE_APP_ENV);

const allTools = [
    {
        id: 'mediciones',
        label: 'Mediciones',
        description: 'Punto, linea, poligono',
        icon: 'medicion',
    },
    {
        id: 'compare-swipe',
        label: 'Barra divisora',
        description: 'Swipe vertical',
        beta: true,
        nonProdOnly: true,
        icon: 'tool_swipe',
    },
    {
        id: 'anotaciones',
        label: 'Anotaciones',
        description: 'Texto, emojis, trazo libre',
        icon: 'emoji',
    },
];

const tools = allTools.filter(tool => !tool.nonProdOnly || IS_NON_PROD);

const ToolsMenu = ({ close, closeButton, toggleMeasurementTools, areMeasurementToolsVisible, areAnnotationToolsVisible, toggleAnnotationTools }) => {
    const { compareMode, exitCompareMode, enterCompareMode } = useMapsContext();
    const { closeSider } = useSider();
    const [hoveredId, setHoveredId] = useState(null);

    const startSwipe = () => {
        enterCompareMode();
        closeSider?.();
    };

    const handleClick = (id) => {
        if (id === 'mediciones') {
            toggleMeasurementTools?.();
        } else if (id === 'anotaciones') {
            toggleAnnotationTools?.();
        } else if (id === 'compare-swipe') {
            if (compareMode?.active) {
                exitCompareMode();
            } else {
                startSwipe();
            }
        }
        close?.();
    };

    const isActive = (id) => {
        if (id === 'mediciones') return !!areMeasurementToolsVisible;
        if (id === 'anotaciones') return !!areAnnotationToolsVisible;
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
                                <span className="text-[11px] opacity-90">Compara dos mapas con barra divisora. Tus capas actuales van al lado A; el lado B empieza <span className="font-bold">vacío</span> para que agregues otra capa.</span>
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
                                        <Icon name={tool.icon} className="w-12 h-12" />
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
