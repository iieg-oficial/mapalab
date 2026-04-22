import { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { trackLayerDetailOpen, trackPeriodicityAdvanced } from '@services/analyticsService';
import { useLayerMetadata } from '../../hooks/useLayerMetadata';
import { useLayerPeriodicity } from '../../hooks/useLayerPeriodicity';
import { useLayerDownload } from '../../hooks/useLayerDownload';
import { useSider } from '@contexts/SiderContext';
import MapsContext from '@contexts/MapsContext';
import { findLayerDef, findWMSConfig } from '../../helpers/wmsConfig';
import { fetchGeometryType } from '../../../../utils/featureInfoUtils';
import { formatDateString } from '../../helpers/dateFilterHelpers';
import { buildLoopValues } from '../../helpers/dateLoopHelpers';
import DateTreeSelector from './components/DateTreeSelector';
import SimpleDateSelector from './components/SimpleDateSelector';
import { PlayPauseButton, LoopIntervalButton, LoopDirectionButton } from './components/SimpleDateSelectorParts';
import OpacityControl from './components/OpacityControl';
import InfoCard from './components/InfoCard';
import StatCard from './components/StatCard';
import LayerInfoSections from './components/LayerInfoSections';
import LayerThemeAvatar from './components/LayerThemeAvatar';
import DownloadButton from './components/DownloadButton';
import DownloadMenu from './components/DownloadMenu';
import Icon from '@components/Icon';
import Logo from '@components/Logo';
import Loading from '@components/Loading';

const LayerDetailModal = () => {
    const {
        selectedLayer, setSelectedLayer, applyFilter, clearFilter, getFilter, getSpecificFilter,
        getLayerOpacity, setLayerOpacity,
        getLoopState, startLoop, toggleLoop, stopLoop, inferLoopConfig,
        getLoopPrefs, setLoopIntervalMs, setLoopDirection,
        allLayers
    } = useContext(MapsContext);
    const [expandedYear, setExpandedYear] = useState(null);

    const layerDef = useMemo(() => {
        if (!selectedLayer?.id) return null;
        return findLayerDef(selectedLayer.id, allLayers);
    }, [selectedLayer?.id]);
    const rasterPeriodicity = layerDef?.rasterPeriodicity || null;
    const hidePeriodicity = layerDef?.hidePeriodicity || false;
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    const { metadata, loading } = useLayerMetadata(selectedLayer?.id);
    const { periodicity, loading: periodicityLoading } = useLayerPeriodicity(selectedLayer?.id);
    const { isMobile } = useSider();
    const [singleSelectOnly, setSingleSelectOnly] = useState(false);

    const download = useLayerDownload(selectedLayer?.id, { getFilter, getSpecificFilter, metadata });

    useEffect(() => {
        if (!selectedLayer?.id || rasterPeriodicity) return;
        const wmsConfig = findWMSConfig(selectedLayer.id, allLayers);
        if (!wmsConfig) return;
        let cancelled = false;
        fetchGeometryType(wmsConfig.baseUrl, wmsConfig.layerName).then(type => {
            if (!cancelled) setSingleSelectOnly(type === 'polygon');
        });
        return () => { cancelled = true; };
    }, [selectedLayer?.id, rasterPeriodicity]);

    const hasPeriodicity = !hidePeriodicity && (periodicity != null || periodicityLoading || rasterPeriodicity != null);

    const periodicityLongPressRef = useRef(null);

    const handlePeriodicityClick = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) {
            setIsAdvancedMode(prev => !prev);
        }
    }, []);

    const handlePeriodicityTouchStart = useCallback(() => {
        periodicityLongPressRef.current = setTimeout(() => {
            periodicityLongPressRef.current = 'fired';
            setIsAdvancedMode(prev => !prev);
        }, 1000);
    }, []);

    const handlePeriodicityTouchEnd = useCallback(() => {
        if (periodicityLongPressRef.current && periodicityLongPressRef.current !== 'fired') {
            clearTimeout(periodicityLongPressRef.current);
        }
        periodicityLongPressRef.current = null;
    }, []);

    const handleDateFilterApply = (filterData) => {
        if (selectedLayer && selectedLayer.id) {
            applyFilter(selectedLayer.id, filterData.filterName, filterData.cqlFilter);
        }
    };

    const handleClearFilter = () => {
        if (selectedLayer && selectedLayer.id) {
            clearFilter(selectedLayer.id, 'date');
        }
    };

    const loopState = selectedLayer?.id ? getLoopState?.(selectedLayer.id) : null;
    const isLoopPlaying = loopState?.isPlaying ?? false;
    const dateFilter = selectedLayer?.id ? getSpecificFilter?.(selectedLayer.id, 'date') : null;
    const hasDateFilter = !!dateFilter;
    const layerPrefs = selectedLayer?.id ? getLoopPrefs?.(selectedLayer.id) : null;
    const layerIntervalMs = layerPrefs?.intervalMs;
    const layerDirection = layerPrefs?.direction;

    const viewLoopConfig = () => {
        if (!selectedLayer?.id) return null;
        const rp = rasterPeriodicity;
        const p = periodicity;
        if (expandedYear != null) {
            const values = buildLoopValues({ mode: 'month', year: expandedYear, rasterPeriodicity: rp, periodicity: p });
            return values.length >= 2 ? { mode: 'month', year: expandedYear, values } : null;
        }
        const values = buildLoopValues({ mode: 'year', rasterPeriodicity: rp, periodicity: p });
        return values.length >= 2 ? { mode: 'year', values } : null;
    };

    const canPlay = !!selectedLayer?.id && (!!loopState || viewLoopConfig() != null || inferLoopConfig?.(selectedLayer.id) != null);

    const handleTogglePeriodicityLoop = () => {
        if (!selectedLayer?.id) return;
        if (loopState?.isPlaying) {
            stopLoop?.(selectedLayer.id);
            return;
        }
        const desiredMode = expandedYear != null ? 'month' : 'year';
        if (loopState && loopState.mode === desiredMode) {
            toggleLoop?.(selectedLayer.id);
            return;
        }
        if (loopState) stopLoop?.(selectedLayer.id);
        const config = viewLoopConfig() || inferLoopConfig?.(selectedLayer.id);
        if (config) startLoop?.(selectedLayer.id, config);
    };

    const handleClearDateFilter = () => {
        if (!selectedLayer?.id) return;
        stopLoop?.(selectedLayer.id);
        clearFilter(selectedLayer.id, 'date');
    };

    useEffect(() => {
        if (selectedLayer?.id) trackLayerDetailOpen(selectedLayer.id);
    }, [selectedLayer?.id]);

    useEffect(() => {
        if (isAdvancedMode && selectedLayer?.id) trackPeriodicityAdvanced(selectedLayer.id);
    }, [isAdvancedMode, selectedLayer?.id]);

    if (!selectedLayer) return null;

    return (
        <div className="fixed top-4 sm:top-4 bottom-0 right-0 sm:right-4 z-30 w-full sm:w-[643px] pointer-events-none">
            <div className={`
                h-full bg-white shadow-[0_5px_20px_#1A26641A] backdrop-blur-sm overflow-y-auto pointer-events-auto rounded-t-[20px] rounded-b-none
                scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400
            `}>
                <div className="sticky top-0 z-10 bg-white backdrop-blur-sm p-4 sm:px-6 sm:pt-6">
                    <div className="flex justify-between items-center">
                        <OpacityControl
                            value={getLayerOpacity(selectedLayer.id)}
                            onChange={(opacity) => setLayerOpacity(selectedLayer.id, opacity)}
                        />
                        <div className="flex items-center gap-2 md:gap-5">
                            {metadata?.capa_descargable !== false && (
                                <>
                                    <DownloadButton
                                        downloading={download.downloading}
                                        progress={download.progress}
                                        disabled={download.downloadDisabled}
                                        onDownload={download.handleQuickDownload}
                                        onCancel={download.handleCancelDownload}
                                        onMenuToggle={() => download.setMenuOpen(prev => !prev)}
                                        menuAnchorRef={download.menuAnchorRef}
                                        isMobile={isMobile}
                                    />
                                    <DownloadMenu
                                        open={download.menuOpen}
                                        anchorRef={download.menuAnchorRef}
                                        onClose={() => download.setMenuOpen(false)}
                                        isRaster={download.isRaster}
                                        hasDateFilter={download.hasDateFilter}
                                        availableMetadata={download.availableMetadata}
                                        onDownload={download.handleMenuDownload}
                                    />
                                </>
                            )}
                            <Icon name="cerrarModal" aria-label="Cerrar" onClick={() => setSelectedLayer(null)} classNameBG="rounded-full hover:shadow-[0px_5px_20px_#101F3629]" className="cursor-pointer" />
                        </div>
                    </div>
                </div>

                <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                    {loading ? (
                        <div className="flex flex-col items-center">
                            <Logo name="mapalab" size="size-36" className="mt-40 lg:mt-52" isLoading />
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <LayerThemeAvatar name={metadata?.tema} size="md" />
                                <span className="text-[14px]/[47px] font-garet font-bold text-[#465055] tracking-normal">
                                    {metadata?.tema || 'General'}
                                </span>
                            </div>
                            <h3 className="text-[18px]/[47px] font-garet font-extrabold text-[#5C2472] tracking-normal">
                                {selectedLayer.name || 'Capa sin nombre'}
                            </h3>

                            {(metadata?.frecuencia_actualizacion || metadata?.fecha_ultima_actualizacion) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <InfoCard label="Frecuencia de actualización" value={metadata.frecuencia_actualizacion} />
                                    <InfoCard label="Última actualización" value={formatDateString(metadata.fecha_ultima_actualizacion)} />
                                </div>
                            )}

                            {metadata?.descripcion && (
                                <div className="mb-4">
                                    <p className="text-[14px]/[32px] text-left font-garet font-medium text-[#465055] tracking-normal">
                                        {metadata.descripcion}
                                    </p>
                                </div>
                            )}

                            {metadata?.numeralia?.filter(s => s.nombre || s.valor).length > 0 && (
                                <div className="mb-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {metadata.numeralia.filter(s => s.nombre || s.valor).map((stat, index) => (
                                            <StatCard key={index} label={stat.nombre} value={stat.valor} simbolo={stat.simbolo} />
                                        ))}
                                    </div>
                                    {metadata?.nombre_pie_numeralia && (
                                        <p className="text-[10px]/[11px] font-garet font-medium text-[#465055] tracking-normal mt-6">
                                            {metadata.nombre_pie_numeralia}
                                        </p>
                                    )}
                                </div>
                            )}

                            {hasPeriodicity && (
                                <div className="mb-4">
                                    <div className="flex items-center justify-between gap-2 my-5 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <button type="button" className="text-[14px]/[16px] font-garet font-bold text-[#5C2472] tracking-normal select-none cursor-pointer" onClick={handlePeriodicityClick} onTouchStart={handlePeriodicityTouchStart} onTouchEnd={handlePeriodicityTouchEnd} onTouchCancel={handlePeriodicityTouchEnd}>
                                                Periodicidad:
                                            </button>
                                            {isAdvancedMode && (
                                                <Icon
                                                    name="info_warning"
                                                    className="size-4 cursor-help"
                                                    tooltip="Click simple: navegar opciones. Doble click: seleccionar fecha. Click en seleccionado: deseleccionar."
                                                />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {canPlay && (
                                                <>
                                                    <LoopIntervalButton value={layerIntervalMs} onChange={(ms) => setLoopIntervalMs(selectedLayer.id, ms)} />
                                                    <LoopDirectionButton value={layerDirection} onChange={(dir) => setLoopDirection(selectedLayer.id, dir)} />
                                                    <PlayPauseButton isPlaying={isLoopPlaying} onToggle={handleTogglePeriodicityLoop} />
                                                </>
                                            )}
                                            {hasDateFilter && (
                                                <button onClick={handleClearDateFilter} className="inline-flex items-center justify-center h-[30px] leading-none align-middle">
                                                    <Icon
                                                        tooltip="Eliminar filtro"
                                                        name="eliminar"
                                                        state="hover"
                                                        className="size-5 cursor-pointer block"
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {periodicityLoading ? (
                                        <div className="flex items-center gap-2 py-4">
                                            <Loading visible size="size-5" border="border-2" color="border-[#703089]" />
                                            <span className="text-[12px] font-garet text-[#465055]">Cargando periodicidad...</span>
                                        </div>
                                    ) : isAdvancedMode && !rasterPeriodicity ? (
                                        <DateTreeSelector layerId={selectedLayer.id} periodicity={periodicity} onFilterApply={handleDateFilterApply} onClearFilter={handleClearFilter} filterName="date" singleSelectOnly={singleSelectOnly} />
                                    ) : (
                                        <SimpleDateSelector layerId={selectedLayer.id} periodicity={periodicity} rasterPeriodicity={rasterPeriodicity} onFilterApply={handleDateFilterApply} onClearFilter={handleClearFilter} filterName="date" singleSelectOnly={singleSelectOnly} onExpandedYearChange={setExpandedYear} />
                                    )}
                                </div>
                            )}


                            <LayerInfoSections metadata={metadata} layerName={selectedLayer.name} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LayerDetailModal;
