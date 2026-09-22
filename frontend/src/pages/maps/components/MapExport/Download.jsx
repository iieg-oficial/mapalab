import { useState, useRef, useEffect, useMemo } from 'react';
import { trackMapExport } from '@services/analyticsService';
import { useMapDownload } from './hooks/useMapDownload';
import { QUALITY_PRESETS } from './utils/exportDimensions';
import { useSider } from '@contexts/SiderContext';
import { useMapsContext } from '@hooks/useMaps';
import { useView3d } from '@contexts/View3dContext';
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
import PanelHoja from '@components/PanelHoja';
import Segmented from '@components/Segmented';
import { HIDDEN_SCROLLBAR } from '@constants/global';
import { ultimaSeleccion } from './utils/seleccionDescarga';
import { VISTA_ANALITICA, opcionesFormato, opcionesVista, textoBotonDescarga, tooltipBotonDescarga } from './utils/opcionesDescarga';

const Download = ({ onOpenPreview, onOpenChange, collapsed = false, expanded = false }) => {
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
    const { compareMode, selectedLayerForSymbology, allLayers, measurements } = useMapsContext();
    const isSwipe = !!compareMode?.active;
    const { active: en3d } = useView3d();
    const seleccion = useMemo(() => ultimaSeleccion(measurements), [measurements]);
    const haySeleccion = !!seleccion && !isSwipe;
    const [includeSwipeBar, setIncludeSwipeBar] = useState(true);
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
        if (viewType === 'seleccion' && !haySeleccion) setViewType('viewport');
        if (en3d && viewType !== 'viewport') setViewType('viewport');
    }, [viewType, haySeleccion, en3d]);

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
        ? { swipeBar: includeSwipeBar, swipePills: includeSwipePills && swipePills.length > 0, pills: swipePills }
        : null;

    const executeDownload = async () => {
        const quality = QUALITY_PRESETS[qualityIndex];
        if (viewType === 'viewport') {
            if (onOpenPreview) {
                onOpenPreview(format, selectedLegendLayers, title, quality, swipeOptions);
            }
        } else {
            await downloadMap(format, selectedLegendLayers, viewType, title, null, quality, swipeOptions, seleccion);
        }
    };

    const handleConfirmDownload = () => {
        handleSetIsPanelOpen(false);
        trackMapExport(format, QUALITY_PRESETS[qualityIndex].label, VISTA_ANALITICA[viewType]);
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
                        'flex items-center justify-center whitespace-nowrap',
                        'text-center h-12.5 rounded-[30px] transition',
                        collapsed || isMobile ? 'w-12.5' : (expanded ? 'w-12.5 md:w-auto md:px-6' : 'w-12.5 md:w-30'),
                        'font-garet font-bold text-[14px] hover:shadow-[0_6px_6px_#5C247234]',
                        canDownload ? 'bg-[#703089] text-white hover:bg-[#5C2472]' : 'bg-black/5 text-black/40 cursor-not-allowed',
                    ].join(' ')}
                >
                    {(isMobile || collapsed) ? <Icon name="download" /> : (isDownloading ? 'Generando…' : (expanded ? 'Descargar visualización' : 'Descargar'))}
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
                mobileFullscreen={false}
                hideHeader
                noPadding
                bg="bg-transparent"
            >
                <PanelHoja
                    titulo={isSwipe ? 'Descargar comparador' : 'Descargar mapa'}
                    onCerrar={() => handleSetIsPanelOpen(false)}
                    className={`gap-3 min-h-0 overflow-y-auto ${HIDDEN_SCROLLBAR}`}
                >
                    <Segmented
                        variant="panel"
                        ariaLabel="Formato"
                        options={opcionesFormato(isSwipe)}
                        value={format}
                        onChange={setFormat}
                    />
                    <Segmented
                        variant="panel"
                        ariaLabel="Vista"
                        options={opcionesVista({ haySeleccion: !!seleccion, isSwipe, es3d: en3d })}
                        value={viewType}
                        onChange={setViewType}
                    />

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

                    {layersWithLegends.length > 0 && (
                        <ScrollContainer className="max-h-40 bg-white rounded-[7px] p-2">
                            {layersWithLegends.map(layer => {
                                const isSelected = selectedLegendLayers.some(l => l.id === layer.id);
                                return (
                                    <Tooltip
                                        key={layer.id}
                                        content={format === 'pdf' ? 'Incluye la leyenda de esta capa en el PDF' : 'Usa la leyenda de esta capa en la imagen'}
                                        placement="left"
                                        delay={400}
                                        triggerBlock
                                    >
                                        <SymbologyItem
                                            layer={layer}
                                            isExpanded={false}
                                            onToggle={() => { }}
                                            showDivider={true}
                                            simple={true}
                                            onClick={() => handleLayerSelect(layer)}
                                            prefix={<Checkbox checked={isSelected} />}
                                        />
                                    </Tooltip>
                                );
                            })}
                        </ScrollContainer>
                    )}

                    {isSwipe && (
                        <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                            <Tooltip content="Dibuja la línea que separa los dos mapas" placement="left" delay={400} triggerBlock>
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                    <Checkbox checked={includeSwipeBar} onChange={() => setIncludeSwipeBar(p => !p)} />
                                    Incluir barra divisora
                                </label>
                            </Tooltip>
                            <Tooltip content="Pone la etiqueta A o B y la fecha de cada lado" placement="left" delay={400} triggerBlock>
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                    <Checkbox checked={includeSwipePills} onChange={() => setIncludeSwipePills(p => !p)} />
                                    Incluir etiquetas A / B con fecha
                                </label>
                            </Tooltip>
                        </div>
                    )}

                    <Tooltip content={tooltipBotonDescarga(viewType)} placement="top" delay={400} triggerBlock>
                        <button
                            type="button"
                            onClick={handleConfirmDownload}
                            className="w-full h-12.5 bg-[#703089] text-white rounded-[30px] hover:bg-[#5C2472] hover:shadow-[0_6px_6px_#5C247234] transition font-garet font-bold text-[14px] cursor-pointer"
                        >
                            {textoBotonDescarga(viewType, format)}
                        </button>
                    </Tooltip>
                </PanelHoja>
            </Panel>
        </div>
    );
};

export default Download;
