import { useState, useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useView3d } from '@contexts/View3dContext';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { canUseVectorService } from '@pages/maps/helpers/serviceMode';
import { useSider } from '@contexts/SiderContext';
import Badge from '@components/Badge';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useIsNonProd } from '@hooks/useDevTools';
import { useGoToCatalogo } from '@pages/catalogo/useGoToCatalogo';

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
        id: 'tabla',
        label: 'Tabla de datos',
        description: 'Columnas, celdas y filtros',
        beta: true,
        nonProdOnly: true,
        icon: 'tabla',
    },
    {
        id: 'anotaciones',
        label: 'Anotaciones',
        description: 'Texto, emojis, trazo libre',
        icon: 'emoji',
    },
    {
        id: 'catalogo',
        label: 'Catálogo',
        description: 'Explora y descarga capas sueltas',
        beta: true,
        nonProdOnly: true,
        icon: 'capa_activa',
        iconHover: 'orange',
    },
];

const ToolsMenu = ({ close, closeButton, toggleMeasurementTools, areMeasurementToolsVisible, areAnnotationToolsVisible, toggleAnnotationTools }) => {
    const {
        compareMode, exitCompareMode, enterCompareMode,
        selectedLayer, selectedLayerForSymbology, activeLayerIds, allLayers,
    } = useMapsContext();
    const { activo: tablaActiva, abrir: abrirTabla, cerrarTodas: cerrarTablas } = useTablaAtributos();
    const { closeSider, isMobile } = useSider();
    const goToCatalogo = useGoToCatalogo();
    const [hoveredId, setHoveredId] = useState(null);
    const isNonProd = useIsNonProd();
    const tools = useMemo(
        () => allTools.filter(tool => !tool.nonProdOnly || isNonProd),
        [isNonProd],
    );

    const capaParaTabla = () => {
        const enFoco = selectedLayerForSymbology?.id || selectedLayer?.id || null;
        if (enFoco) return enFoco;
        const conTabla = (activeLayerIds || []).find(id => {
            const layerDef = findLayerDef(id, allLayers || []);
            return layerDef && canUseVectorService(layerDef);
        });
        return conTabla || (activeLayerIds || [])[0] || null;
    };

    const alternarTabla = () => {
        if (tablaActiva) {
            cerrarTablas();
            return;
        }
        abrirTabla(capaParaTabla());
    };

    const { exit: exit3d } = useView3d();

    const startSwipe = () => {
        enterCompareMode();
        closeSider?.();
    };

    const handleClick = (id) => {
        if (id === 'anotaciones' || (id === 'compare-swipe' && isMobile)) exit3d();
        if (id === 'mediciones') {
            toggleMeasurementTools?.();
        } else if (id === 'anotaciones') {
            toggleAnnotationTools?.();
        } else if (id === 'tabla') {
            alternarTabla();
        } else if (id === 'catalogo') {
            goToCatalogo();
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
        if (id === 'tabla') return tablaActiva;
        if (id === 'compare-swipe') return !!compareMode?.active;
        return false;
    };

    return (
        <>
            <div className="py-6 px-4">
                <div className="flex items-center justify-between">
                    <h3 className="block text-[18px]/[47px] font-garet font-bold mb-2 text-purple tracking-normal">
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
                                <span className="text-[11px] opacity-90">Compara dos mapas con barra divisora. Tus capas actuales van al lado α; el lado β empieza <span className="font-bold">vacío</span> para que agregues otra capa.</span>
                                <span className="text-[11px] opacity-90">Agrega capas en cada slot (A o B) <span className="font-bold">una por una</span> para mejor rendimiento.</span>
                            </div>
                        ) : tool.id === 'catalogo' ? tool.description : tool.label;
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
                                    ${active ? 'border-purple-deep' : 'border-transparent hover:border-purple-deep'}
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
                                    <div className={`flex items-center justify-center ${active || hovered ? 'text-purple' : 'text-graphite'}`}>
                                        <Icon
                                            name={tool.icon}
                                            state={tool.iconHover && (active || hovered) ? tool.iconHover : 'normal'}
                                            className="w-12 h-12"
                                        />
                                    </div>
                                    <span className={`text-[12px]/[18px] font-garet text-center ${active ? 'font-bold text-purple' : 'font-medium text-graphite'}`}>
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
