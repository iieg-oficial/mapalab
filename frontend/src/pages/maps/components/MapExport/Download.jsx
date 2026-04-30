import { useState, useRef, useEffect } from 'react';
import { trackMapExport } from '@services/analyticsService';
import { useMapDownload } from './hooks/useMapDownload';
import { QUALITY_PRESETS } from './utils/exportDimensions';
import { useSider } from '@contexts/SiderContext';
import { useMapsContext } from '@hooks/useMaps';
import SymbologyItem from '../SymbologyItem';
import Checkbox from '@components/Checkbox';
import Icon from '@components/Icon';
import Panel from '@components/Panel';
import Tooltip from '@components/Tooltip';
import { LICENCIA_URL, LICENCIA_TEXTO } from '@constants/app';
import ScrollContainer from '@components/ScrollContainer';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { computeLabelLong } from '../ActiveLayers/datePillHelpers';
import Badge from '@components/Badge';

const licenciaContent = (
    <span className="text-[11px]/[15px]">
        {LICENCIA_TEXTO}{' '}
        <a href={LICENCIA_URL} target="_blank" rel="noopener noreferrer" className="underline font-semibold">Licencia IIEG 2026</a>
    </span>
);
import QualitySelector from './QualitySelector';

const Download = ({ onOpenPreview, onOpenChange }) => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedLegendLayers, setSelectedLegendLayers] = useState([]);
    const [title, setTitle] = useState('Capas mapalab');
    const { isMobile } = useSider();
    const anchorRef = useRef(null);
    const [format, setFormat] = useState('png');
    const [viewType, setViewType] = useState('viewport');
    const [qualityIndex, setQualityIndex] = useState(1);

    const {
        downloadMap, isDownloading, canDownload,
        layersWithLegends, selectedLayer
    } = useMapDownload();
    const { compareMode, selectedLayerForSymbology, allLayers } = useMapsContext();
    const isSwipe = !!compareMode?.active;
    const [includeSwipeBar, setIncludeSwipeBar] = useState(true);
    const [includeSwipeLabels, setIncludeSwipeLabels] = useState(true);
    const [includeSwipePills, setIncludeSwipePills] = useState(true);

    const swipePills = (() => {
        if (!isSwipe) return [];
        const layerId = selectedLayerForSymbology?.id;
        if (!layerId) return [];
        const layerDef = findLayerDef(layerId, allLayers);
        const rasterPeriodicity = layerDef?.rasterPeriodicity || null;
        const inA = compareMode.paneA?.activeLayerIds?.includes(layerId);
        const inB = compareMode.paneB?.activeLayerIds?.includes(layerId);
        const list = [];
        if (inA) {
            const { label } = computeLabelLong(compareMode.paneA?.filters?.[layerId]?.date, rasterPeriodicity);
            if (label) list.push({ slot: 'A', label });
        }
        if (inB) {
            const { label } = computeLabelLong(compareMode.paneB?.filters?.[layerId]?.date, rasterPeriodicity);
            if (label) list.push({ slot: 'B', label });
        }
        return list;
    })();

    useEffect(() => {
        if (isSwipe) {
            if (format !== 'png') setFormat('png');
            if (qualityIndex !== 1) setQualityIndex(1);
        }
    }, [isSwipe, format, qualityIndex]);

    useEffect(() => {
        const layer = selectedLayer || layersWithLegends[0];
        setTitle(layer?.label || layer?.name || 'Capas mapalab');
    }, [selectedLayer, layersWithLegends]);

    useEffect(() => {
        if (layersWithLegends.length === 0) {
            setSelectedLegendLayers([]);
            return;
        }

        if (format === 'pdf') {
            setSelectedLegendLayers(layersWithLegends);
            return;
        }

        const targetLayer = selectedLayer
            ? layersWithLegends.find(l => l.id === selectedLayer.id)
            : null;

        if (targetLayer) {
            setSelectedLegendLayers([targetLayer]);
        } else if (selectedLegendLayers.length !== 1 || !layersWithLegends.find(l => l.id === selectedLegendLayers[0]?.id)) {
            setSelectedLegendLayers([layersWithLegends[0]]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [format, layersWithLegends, selectedLayer, isPanelOpen]);

    const handleSetIsPanelOpen = (isOpen) => {
        setIsPanelOpen(isOpen);
        if (onOpenChange) onOpenChange(isOpen);
    };

    const handleDownloadClick = () => {
        if (!canDownload || isDownloading) return;
        handleSetIsPanelOpen(true);
    };

    const swipeOptions = isSwipe
        ? { swipeBar: includeSwipeBar, swipeLabels: includeSwipeLabels, swipePills: includeSwipePills && swipePills.length > 0, pills: swipePills }
        : null;

    const executeDownload = async () => {
        const quality = QUALITY_PRESETS[qualityIndex];
        if (viewType === 'viewport') {
            if (onOpenPreview) {
                onOpenPreview(format, selectedLegendLayers, title, quality, swipeOptions);
            }
        } else {
            await downloadMap(format, selectedLegendLayers, viewType, title, null, quality, swipeOptions);
        }
    };

    const handleConfirmDownload = () => {
        handleSetIsPanelOpen(false);
        trackMapExport(format, QUALITY_PRESETS[qualityIndex].label, viewType === 'viewport' ? 'vista_actual' : 'estado_completo');
        executeDownload();
    };

    const handleLayerSelect = (layer) => {
        if (format === 'pdf') {
            setSelectedLegendLayers(prev => {
                const exists = prev.find(l => l.id === layer.id);
                if (exists) {
                    return prev.filter(l => l.id !== layer.id);
                } else {
                    return [...prev, layer];
                }
            });
        } else {
            setSelectedLegendLayers([layer]);
            setTitle(layer?.label || layer?.name || 'Capas mapalab');
        }
    };

    return (
        <div className="flex flex-col relative">
            <Tooltip content={licenciaContent} placement="top" delay={300} interactive>
                <button
                    ref={anchorRef}
                    type="button"
                    onClick={handleDownloadClick}
                    disabled={!canDownload || isDownloading}
                    className={[
                        'flex items-center justify-center',
                        'text-center w-12.5 md:w-[235px] h-12.5 rounded-[30px] transition ',
                        'font-garet font-bold text-[14px] hover:shadow-[0_6px_6px_#5C247234]',
                        canDownload ? 'bg-[#703089] text-white hover:bg-[#5C2472]' : 'bg-black/5 text-black/40 cursor-not-allowed',
                    ].join(' ')}
                >
                    {isMobile ? <Icon name="download" /> : (isDownloading ? 'Generando…' : 'Descargar visualización')}
                </button>
            </Tooltip>

            <Panel
                open={isPanelOpen}
                anchorRef={anchorRef}
                onClose={() => handleSetIsPanelOpen(false)}
                variant="solid"
                width="w-80"
                maxHeight="max-h-200 max-md:max-h-[calc(100dvh-6rem)]"
                className="z-50 mt-4 shadow-none border-none rounded-[14px]"
                placement="bottom-end"
                title={<span className="font-garet font-bold text-[14px]/[47px]">{isSwipe ? 'Descargar comparador' : 'Descargar mapa'}</span>}
                mobileFullscreen={false}
                footer={
                    <div className="px-2 pb-2">
                        <button
                            onClick={handleConfirmDownload}
                            className="w-full h-12.5 bg-[#703089] text-white rounded-[30px] hover:bg-[#5C2472] hover:shadow-[0_6px_6px_#5C247234] transition font-garet font-bold text-[14px]"
                        >
                            {viewType === 'viewport' ? 'Ir a seleccionar área' : `Descargar ${format.toUpperCase()}`}
                        </button>
                    </div>
                }
            >
                <div className="flex flex-col px-4 pb-4 gap-4">

                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb">
                        Formato
                    </div>
                    <div className="flex gap-2 mb-2 flex-wrap">
                        {[
                            { id: 'png', disabled: false, swipeOnly: false },
                            { id: 'jpeg', disabled: isSwipe, swipeOnly: false },
                            { id: 'pdf', disabled: isSwipe, swipeOnly: false },
                            { id: 'gif', disabled: true, swipeOnly: true },
                        ].filter(f => !f.swipeOnly || isSwipe).map(({ id: fmt, disabled }) => (
                            <button
                                key={fmt}
                                type="button"
                                onClick={() => !disabled && setFormat(fmt)}
                                disabled={disabled}
                                className={`relative px-3 py-1.5 text-sm rounded-[14px] border transition-colors ${disabled ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50' : (format === fmt ? 'bg-[#FF8300] border-transparent text-white font-medium' : 'border-[#703089] text-[#703089] hover:bg-[#703089] hover:text-white')}`}
                            >
                                {fmt.toUpperCase()}
                                {disabled && (
                                    <Badge variant="pill" color="orange" text="PRÓXIMAMENTE" className="absolute -top-2 -right-2 text-[8px] px-1.5" />
                                )}
                            </button>
                        ))}
                    </div>

                    {!isSwipe && (
                        <QualitySelector
                            value={qualityIndex}
                            onChange={setQualityIndex}
                            isPanelOpen={isPanelOpen}
                        />
                    )}
                    {isSwipe && (
                        <div className="text-[11px] text-gray-500">
                            Calidad: <span className="font-bold">Normal</span>. Otras calidades quedan habilitadas en mapa simple.
                        </div>
                    )}

                    <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Vista
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setViewType('viewport')}
                                className={`
                                    px-3 py-2 text-sm rounded-[14px] border transition-colors text-left
                                    ${viewType === 'viewport'
            ? 'bg-[#FF8300] border-transparent text-white font-medium'
            : 'border-[#703089] text-[#703089] hover:bg-[#703089] hover:text-white'
        }
                                `}
                            >
                                <div className="font-medium">Seleccionar Área (Vista actual)</div>
                                <div className="text-xs opacity-75">Activar recuadro de recorte manual</div>
                            </button>
                            <button
                                onClick={() => setViewType('full-state')}
                                className={`
                                    px-3 py-2 text-sm rounded-[14px] border transition-colors text-left
                                    ${viewType === 'full-state'
            ? 'bg-[#703089] border-[#703089] text-white font-medium'
            : 'border-[#703089] text-[#703089] hover:bg-[#703089] hover:text-white'
        }
                                `}
                            >
                                <div className="font-medium">Estado completo</div>
                                <div className="text-xs opacity-75">Automático (Todo Jalisco)</div>
                            </button>
                        </div>
                    </div>

                    {layersWithLegends.length > 0 && (
                        <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                {format === 'pdf' ? 'Leyendas' : 'Leyenda'}
                            </div>

                            <ScrollContainer className="max-h-40 border border-gray-100 rounded">
                                {layersWithLegends.map(layer => {
                                    const isSelected = selectedLegendLayers.some(l => l.id === layer.id);
                                    return (
                                        <SymbologyItem
                                            key={layer.id}
                                            layer={layer}
                                            isExpanded={false}
                                            onToggle={() => { }}
                                            showDivider={true}
                                            simple={true}
                                            onClick={() => handleLayerSelect(layer)}
                                            prefix={
                                                <Checkbox checked={isSelected} />
                                            }
                                        />
                                    );
                                })}
                            </ScrollContainer>
                        </div>
                    )}

                    {isSwipe && (
                        <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Opciones del comparador
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                <Checkbox checked={includeSwipeBar} onChange={() => setIncludeSwipeBar(p => !p)} />
                                    Incluir barra divisora
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                <Checkbox checked={includeSwipeLabels} onChange={() => setIncludeSwipeLabels(p => !p)} />
                                    Incluir etiquetas A / B
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                <Checkbox checked={includeSwipePills} onChange={() => setIncludeSwipePills(p => !p)} />
                                    Incluir fechas de la capa seleccionada
                            </label>
                        </div>
                    )}
                </div>
            </Panel>
        </div>
    );
};

export default Download;
