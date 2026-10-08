import { useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useView3d } from '@contexts/View3dContext';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { canUseVectorService } from '@pages/maps/helpers/serviceMode';
import { useSider } from '@contexts/SiderContext';
import Badge from '@components/Badge';
import Tooltip from '@components/Tooltip';
import { useIsNonProd } from '@hooks/useDevTools';
import { useGoToCatalogo } from '@pages/catalogo/useGoToCatalogo';
import IconoHerramienta from './IconoHerramienta';
import { useMinimapaEncendido } from '@pages/maps/hooks/useMinimapaEncendido';
import { trackMinimapa } from '@services/analyticsService';

const allTools = [
    {
        id: 'mediciones',
        label: 'Mediciones',
        description: 'Punto, linea, poligono',
    },
    {
        id: 'compare-swipe',
        label: 'Barra divisora',
        description: 'Swipe vertical',
        beta: true,
        nonProdOnly: true,
    },
    {
        id: 'tabla',
        label: 'Tabla de datos',
        description: 'Columnas, celdas y filtros',
        beta: true,
        nonProdOnly: true,
    },
    {
        id: 'anotaciones',
        label: 'Anotaciones',
        description: 'Texto, emojis, trazo libre',
    },
    {
        id: 'catalogo',
        label: 'Catálogo',
        description: 'Explora y descarga capas sueltas',
        beta: true,
        nonProdOnly: true,
    },
    {
        id: 'minimapa',
        label: 'Minimapa',
        description: 'Muestra dónde estás en Jalisco al acercarte',
        beta: true,
        nonProdOnly: true,
    },
];

const ToolsMenu = ({ close, closeButton, toggleMeasurementTools, areMeasurementToolsVisible, areAnnotationToolsVisible, toggleAnnotationTools }) => {
    const {
        compareMode, exitCompareMode, enterCompareMode, stopDrawing,
        selectedLayer, selectedLayerForSymbology, activeLayerIds, allLayers,
    } = useMapsContext();
    const { activo: tablaActiva, abrir: abrirTabla, cerrarTodas: cerrarTablas } = useTablaAtributos();
    const { closeSider, isMobile } = useSider();
    const goToCatalogo = useGoToCatalogo();
    const [minimapaEncendido, alternarMinimapa] = useMinimapaEncendido();
    const isNonProd = useIsNonProd();
    const tools = useMemo(
        () => allTools.filter(tool => (!tool.nonProdOnly || isNonProd) && !(tool.id === 'minimapa' && isMobile)),
        [isNonProd, isMobile],
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

    const { exit: exit3d, active: en3d } = useView3d();

    const startSwipe = () => {
        stopDrawing?.();
        enterCompareMode();
        closeSider?.();
    };

    const handleClick = (id) => {
        if (id === 'compare-swipe' && isMobile) exit3d();
        if (id === 'anotaciones' && compareMode?.active) exitCompareMode();
        if (id === 'mediciones') {
            if (compareMode?.active && !en3d) exitCompareMode();
            toggleMeasurementTools?.();
        } else if (id === 'anotaciones') {
            toggleAnnotationTools?.();
        } else if (id === 'tabla') {
            alternarTabla();
        } else if (id === 'catalogo') {
            goToCatalogo();
        } else if (id === 'minimapa') {
            trackMinimapa(minimapaEncendido ? 'apagar' : 'encender');
            alternarMinimapa();
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
        if (id === 'minimapa') return minimapaEncendido;
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
                        const tooltipContent = tool.id === 'compare-swipe' ? (
                            <div className="flex flex-col gap-1.5 max-w-[240px]">
                                <span className="font-bold">{tool.label}</span>
                                <span className="text-[11px] opacity-90">Compara dos mapas con barra divisora. Tus capas actuales van al lado α; el lado β empieza <span className="font-bold">vacío</span> para que agregues otra capa.</span>
                                <span className="text-[11px] opacity-90">Agrega capas en cada slot (A o B) <span className="font-bold">una por una</span> para mejor rendimiento.</span>
                            </div>
                        ) : tool.id === 'catalogo' || tool.id === 'minimapa' ? tool.description : tool.label;
                        return (
                            <Tooltip key={tool.id} content={tooltipContent} placement="bottom" delay={300}>
                                <button
                                    type="button"
                                    onClick={() => handleClick(tool.id)}
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
                                    <IconoHerramienta id={tool.id} className="w-12 h-12" />
                                    <span className={`text-[13px]/[18px] font-garet text-center text-black ${active ? 'font-bold' : 'font-medium'}`}>
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
