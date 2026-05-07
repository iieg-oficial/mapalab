import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { trackLayerDetailOpen, trackPeriodicityAdvanced } from '@services/analyticsService';
import { useLayerMetadata } from '../../hooks/useLayerMetadata';
import { useLayerPeriodicity } from '../../hooks/useLayerPeriodicity';
import { useLayerDownload } from '../../hooks/useLayerDownload';
import { useSider } from '@contexts/SiderContext';
import MapsContext from '@contexts/MapsContext';
import { useEventoContext } from '@hooks/useEvento';
import { findLayerDef, findLayerTheme, findWMSConfig } from '../../helpers/wmsConfig';
import { fetchGeometryType } from '../../../../utils/featureInfoUtils';
import { formatDateString } from '../../helpers/dateFilterHelpers';
import { buildLoopValues } from '../../helpers/dateLoopHelpers';
import PeriodicitySection from './components/PeriodicitySection';
import OpacityControl from './components/OpacityControl';
import InfoCard from './components/InfoCard';
import StatCard from './components/StatCard';
import LayerInfoSections from './components/LayerInfoSections';
import LayerDetailHeader from './components/LayerDetailHeader';
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
        getLoopPrefs, setLoopIntervalMs, setLoopDirection, allLayers,
        compareMode, applyFilterToSlot, clearFilterFromSlot, setActiveSlot,
    } = useContext(MapsContext);
    const { activeEvento } = useEventoContext();
    const [expandedYear, setExpandedYear] = useState(null);

    const layerDef = useMemo(() => {
        if (!selectedLayer?.id) return null;
        return findLayerDef(selectedLayer.id, allLayers);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLayer?.id]);
    const themeNode = useMemo(() => {
        if (!selectedLayer?.id) return null;
        return findLayerTheme(selectedLayer.id, allLayers);
    }, [selectedLayer?.id, allLayers]);
    const rasterPeriodicity = layerDef?.rasterPeriodicity || null;
    const hidePeriodicity = layerDef?.hidePeriodicity || false;
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    const { metadata, loading } = useLayerMetadata(selectedLayer?.id);
    const themeName = themeNode?.label || metadata?.tema || 'General';
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLayer?.id, rasterPeriodicity]);

    const hasPeriodicity = !hidePeriodicity && (periodicity != null || periodicityLoading || rasterPeriodicity != null);

    const isSwipe = !!compareMode?.active;
    const inA = isSwipe && compareMode.paneA?.activeLayerIds?.includes(selectedLayer?.id);
    const inB = isSwipe && compareMode.paneB?.activeLayerIds?.includes(selectedLayer?.id);
    const slotMembership = isSwipe ? (inA && inB ? 'AB' : (inA ? 'A' : (inB ? 'B' : null))) : null;

    const onAdvancedToggle = useCallback(() => setIsAdvancedMode(prev => !prev), []);

    const handleDateFilterApply = (filterData) => {
        if (selectedLayer?.id) applyFilter(selectedLayer.id, filterData.filterName, filterData.cqlFilter);
    };
    const handleClearFilter = () => {
        if (selectedLayer?.id) clearFilter(selectedLayer.id, 'date');
    };

    const makeSlotApply = (slot) => (fd) => selectedLayer?.id && applyFilterToSlot?.(selectedLayer.id, slot, fd.filterName, fd.cqlFilter);
    const makeSlotClear = (slot) => () => selectedLayer?.id && clearFilterFromSlot?.(selectedLayer.id, slot, 'date');
    const makeSlotGetFilter = (slot) => (lid, fname) => compareMode?.[`pane${slot}`]?.filters?.[lid]?.[fname] || null;

    const loopState = selectedLayer?.id ? getLoopState?.(selectedLayer.id) : null;
    const isLoopPlaying = loopState?.isPlaying ?? false;
    const dateFilter = selectedLayer?.id ? getSpecificFilter?.(selectedLayer.id, 'date') : null;
    const hasDateFilter = !!dateFilter;
    const layerPrefs = selectedLayer?.id ? getLoopPrefs?.(selectedLayer.id) : null;
    const layerIntervalMs = layerPrefs?.intervalMs;
    const layerDirection = layerPrefs?.direction;

    const viewLoopConfig = () => {
        if (!selectedLayer?.id) return null;
        if (expandedYear != null) {
            const values = buildLoopValues({ mode: 'month', year: expandedYear, rasterPeriodicity, periodicity });
            return values.length >= 2 ? { mode: 'month', year: expandedYear, values } : null;
        }
        const values = buildLoopValues({ mode: 'year', rasterPeriodicity, periodicity });
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

    const togglePeriodicityLoopInSlot = (slot) => {
        if (!selectedLayer?.id) return;
        if (slot && compareMode?.active && compareMode.activeSlot !== slot && !loopState?.isPlaying) {
            setActiveSlot?.(slot);
            requestAnimationFrame(handleTogglePeriodicityLoop);
        } else handleTogglePeriodicityLoop();
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
                            <LayerDetailHeader
                                activeEvento={activeEvento}
                                selectedLayerId={selectedLayer.id}
                                themeName={themeName}
                            />
                            <h3 className="text-[18px]/[47px] font-garet font-extrabold text-[#5C2472] tracking-normal">
                                {selectedLayer.name || selectedLayer.label || layerDef?.label || 'Capa sin nombre'}
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

                            {hasPeriodicity && slotMembership === 'AB' ? (
                                <>
                                    <PeriodicitySection
                                        layerId={selectedLayer.id}
                                        slot="A"
                                        label="Lado A"
                                        periodicity={periodicity}
                                        rasterPeriodicity={rasterPeriodicity}
                                        periodicityLoading={periodicityLoading}
                                        isAdvancedMode={isAdvancedMode}
                                        onAdvancedToggle={onAdvancedToggle}
                                        onFilterApply={makeSlotApply('A')}
                                        onClearFilter={makeSlotClear('A')}
                                        onClearDateFilter={makeSlotClear('A')}
                                        onExpandedYearChange={compareMode.activeSlot === 'A' ? setExpandedYear : undefined}
                                        singleSelectOnly={singleSelectOnly}
                                        hasDateFilter={!!makeSlotGetFilter('A')(selectedLayer.id, 'date')}
                                        showLoopControls={true}
                                        canPlay={canPlay}
                                        isLoopPlaying={isLoopPlaying && compareMode.activeSlot === 'A'}
                                        layerIntervalMs={layerIntervalMs}
                                        layerDirection={layerDirection}
                                        onSetLoopIntervalMs={(ms) => setLoopIntervalMs(selectedLayer.id, ms)}
                                        onSetLoopDirection={(dir) => setLoopDirection(selectedLayer.id, dir)}
                                        onTogglePeriodicityLoop={() => togglePeriodicityLoopInSlot('A')}
                                        getSpecificFilterOverride={makeSlotGetFilter('A')}
                                        loopDisabled={isLoopPlaying && compareMode.activeSlot !== 'A'} loopDisabledHint="Pausa la animación del lado B para iniciar acá" loopAppliesToSlot={isLoopPlaying && compareMode.activeSlot === 'A'}
                                    />
                                    <PeriodicitySection
                                        layerId={selectedLayer.id}
                                        slot="B"
                                        label="Lado B"
                                        periodicity={periodicity}
                                        rasterPeriodicity={rasterPeriodicity}
                                        periodicityLoading={periodicityLoading}
                                        isAdvancedMode={isAdvancedMode}
                                        onAdvancedToggle={onAdvancedToggle}
                                        onFilterApply={makeSlotApply('B')}
                                        onClearFilter={makeSlotClear('B')}
                                        onClearDateFilter={makeSlotClear('B')}
                                        onExpandedYearChange={compareMode.activeSlot === 'B' ? setExpandedYear : undefined}
                                        singleSelectOnly={singleSelectOnly}
                                        hasDateFilter={!!makeSlotGetFilter('B')(selectedLayer.id, 'date')}
                                        showLoopControls={true}
                                        canPlay={canPlay}
                                        isLoopPlaying={isLoopPlaying && compareMode.activeSlot === 'B'}
                                        layerIntervalMs={layerIntervalMs}
                                        layerDirection={layerDirection}
                                        onSetLoopIntervalMs={(ms) => setLoopIntervalMs(selectedLayer.id, ms)}
                                        onSetLoopDirection={(dir) => setLoopDirection(selectedLayer.id, dir)}
                                        onTogglePeriodicityLoop={() => togglePeriodicityLoopInSlot('B')}
                                        getSpecificFilterOverride={makeSlotGetFilter('B')}
                                        loopDisabled={isLoopPlaying && compareMode.activeSlot !== 'B'} loopDisabledHint="Pausa la animación del lado A para iniciar acá" loopAppliesToSlot={isLoopPlaying && compareMode.activeSlot === 'B'}
                                    />
                                </>
                            ) : hasPeriodicity && (
                                <PeriodicitySection
                                    layerId={selectedLayer.id}
                                    slot={slotMembership === 'A' || slotMembership === 'B' ? slotMembership : undefined}
                                    label={slotMembership ? `Lado ${slotMembership}` : null}
                                    periodicity={periodicity}
                                    rasterPeriodicity={rasterPeriodicity}
                                    periodicityLoading={periodicityLoading}
                                    isAdvancedMode={isAdvancedMode}
                                    onAdvancedToggle={onAdvancedToggle}
                                    onFilterApply={slotMembership ? makeSlotApply(slotMembership) : handleDateFilterApply}
                                    onClearFilter={slotMembership ? makeSlotClear(slotMembership) : handleClearFilter}
                                    onClearDateFilter={slotMembership ? makeSlotClear(slotMembership) : handleClearDateFilter}
                                    onExpandedYearChange={setExpandedYear}
                                    singleSelectOnly={singleSelectOnly}
                                    hasDateFilter={hasDateFilter}
                                    showLoopControls={!slotMembership || slotMembership === compareMode?.activeSlot}
                                    canPlay={canPlay}
                                    isLoopPlaying={isLoopPlaying}
                                    loopAppliesToSlot={!slotMembership || (isLoopPlaying && slotMembership === compareMode?.activeSlot)}
                                    layerIntervalMs={layerIntervalMs}
                                    layerDirection={layerDirection}
                                    onSetLoopIntervalMs={(ms) => setLoopIntervalMs(selectedLayer.id, ms)}
                                    onSetLoopDirection={(dir) => setLoopDirection(selectedLayer.id, dir)}
                                    onTogglePeriodicityLoop={handleTogglePeriodicityLoop}
                                    getSpecificFilterOverride={slotMembership ? makeSlotGetFilter(slotMembership) : undefined}
                                />
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
