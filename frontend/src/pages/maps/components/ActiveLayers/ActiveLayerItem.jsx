import { useMapsContext } from '@hooks/useMaps';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { useEventoContext } from '@hooks/useEvento';
import { useSider } from '@contexts/SiderContext';
import Loading from '@components/Loading';
import { useEffect, useMemo, useRef, useState } from 'react';
import Tooltip from '@components/Tooltip';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { LOOP_INTERVAL_PRESETS } from '@hooksMaps/useDateLoop';
import { handleKeyActivate } from '@utils/a11y';

import { DragHandle, LayerTitle, PinBadge, EventoLayerIcon, GeometryTypeBadge } from './LayerItemHeader';
import LayerBadge from '@mapsComponents/LayerBadge';
import LayerDateControls from './LayerDateControls';
import LayerActionsBar from './LayerActionsBar';
import LayerInlineActions from './LayerInlineActions';
import LayerLegendInline from './LayerLegendInline';
import LayerDownloadProgress from './LayerDownloadProgress';
import SlotBadge from './SlotBadge';
import { computeLabel } from './datePillHelpers';
import { ACTIVE_LAYERS_PANEL_WIDTH } from '@pages/maps/helpers/mapFit';
import { useWMSLegend } from '@hooksMaps/useWMSLegend';
import { useLayerMetadata } from '@hooksMaps/useLayerMetadata';
import { useLayerDownload } from '@hooksMaps/useLayerDownload';
import DownloadMenu from '@mapsComponents/LayerDetailModal/components/DownloadMenu';

const ActiveLayerItem = ({ layer, dragHandleProps, isPinned = false }) => {
    const { loadingLayers } = useLayerLoading();
    const { isMobile, width: siderWidth } = useSider();
    const {
        selectedLayerForSymbology,
        setSelectedLayerForSymbology,
        onToggleLayer,
        clearLayerFilters,
        getAllChildLayerIds,
        toggleLayerVisibility,
        setSelectedLayer,
        getLoopState,
        toggleLoop,
        inferLoopConfig,
        getFilter,
        getSpecificFilter,
        getLoopPrefs,
        setLoopIntervalMs,
        setLoopDirection,
        allLayers,
        compareMode,
        removeLayerFromSlot,
        toggleLayerVisibilityInSlot,
        setLayerSlotMembership,
        getLayerOpacity,
        setLayerOpacity,
        setActiveSlot,
        centerOnLayer,
        pulseLayer
    } = useMapsContext();

    const { findEventoByLayerId } = useEventoContext();
    const layerEvento = useMemo(
        () => findEventoByLayerId?.(layer.id) || null,
        [findEventoByLayerId, layer.id]
    );

    const slotMembership = useMemo(() => {
        if (!compareMode?.active) return null;
        const idsToCheck = [layer.id, ...(layer.childIds || [])];
        const paneAIds = compareMode.paneA?.activeLayerIds || [];
        const paneBIds = compareMode.paneB?.activeLayerIds || [];
        const inA = idsToCheck.some(id => paneAIds.includes(id));
        const inB = idsToCheck.some(id => paneBIds.includes(id));
        if (inA && inB) return 'AB';
        if (inA) return 'A';
        if (inB) return 'B';
        return null;
    }, [compareMode?.active, compareMode?.paneA?.activeLayerIds, compareMode?.paneB?.activeLayerIds, layer.id, layer.childIds]);

    const { intervalMs: loopIntervalMs, direction: loopDirection } = getLoopPrefs?.(layer.id) || {};

    const itemRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const isSelected = selectedLayerForSymbology?.id === layer.id;
    const isExpanded = isSelected;
    const showHandle = !isPinned && (isSelected || (!isMobile && isHovered));

    const { metadata } = useLayerMetadata(isExpanded ? layer.id : null);
    const download = useLayerDownload(isExpanded ? layer.id : null, { getFilter, getSpecificFilter, metadata });
    const canDownload = isExpanded && metadata?.capa_descargable !== false;
    const handleDownloadClick = () => {
        if (download.downloading) download.handleCancelDownload();
        else download.setMenuOpen(p => !p);
    };

    useEffect(() => {
        if (isSelected && itemRef.current) {
            itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [isSelected]);

    const canOpenModal = layer.id !== 'curvas_de_nivel';

    const handleClickOnLayer = () => {
        const wasSelected = selectedLayerForSymbology?.id === layer.id;
        setSelectedLayerForSymbology(layer);
        if (!wasSelected) {
            centerOnLayer?.(layer.id, { siderWidth, isMobile, rightPanelWidth: ACTIVE_LAYERS_PANEL_WIDTH });
            pulseLayer?.(layer.id);
        }
    };

    const targetSlot = slotMembership === 'AB' ? compareMode?.activeSlot : slotMembership;

    const handleRemoveClick = (e) => {
        e.stopPropagation();
        if (compareMode?.active) {
            if (slotMembership === 'A' || slotMembership === 'AB') removeLayerFromSlot?.(layer.id, 'A');
            if (slotMembership === 'B' || slotMembership === 'AB') removeLayerFromSlot?.(layer.id, 'B');
            return;
        }
        [layer.id, ...getAllChildLayerIds(layer.id)].forEach(id => clearLayerFilters(id));
        onToggleLayer(layer.id, false);
    };

    const handleToggleVisibilityClick = (e) => {
        e.stopPropagation();
        if (compareMode?.active && targetSlot) return toggleLayerVisibilityInSlot?.(layer.id, targetSlot);
        toggleLayerVisibility(layer.id);
    };

    const handleSetSelectedLayerClick = (e) => {
        e.stopPropagation();
        setSelectedLayer(layer);
    };

    const loopState = getLoopState?.(layer.id);
    const isLooping = loopState?.isPlaying;

    const layerDef = useMemo(() => findLayerDef(layer.id, allLayers), [layer.id, allLayers]);
    const rasterPeriodicity = layerDef?.rasterPeriodicity || null;
    const dateFilter = getSpecificFilter?.(layer.id, 'date') || null;

    const hasAnyDateLabel = useMemo(() => {
        const liveOk = computeLabel(dateFilter, rasterPeriodicity).label;
        const aOk = computeLabel(compareMode?.paneA?.filters?.[layer.id]?.date, rasterPeriodicity).label;
        const bOk = computeLabel(compareMode?.paneB?.filters?.[layer.id]?.date, rasterPeriodicity).label;
        return !!(liveOk || aOk || bOk);
    }, [dateFilter, rasterPeriodicity, compareMode?.paneA?.filters, compareMode?.paneB?.filters, layer.id]);

    const showSlotBadgeInTitle = !!compareMode?.active && !!slotMembership && !hasAnyDateLabel;
    const handleCycleSlot = (next) => setLayerSlotMembership?.(layer.id, next);

    const effectiveOpacity = useMemo(() => {
        const own = getLayerOpacity?.(layer.id) ?? 1;
        if (own !== 1) return own;
        if (layer.childIds?.length) {
            for (const id of layer.childIds) {
                const op = getLayerOpacity?.(id);
                if (op != null && op !== 1) return op;
            }
        }
        return own;
    }, [getLayerOpacity, layer.id, layer.childIds]);

    const canPlayLoop = useMemo(() => {
        if (isLooping) return true;
        return inferLoopConfig?.(layer.id) != null;
    }, [isLooping, inferLoopConfig, layer.id]);

    const handleDateLabelClick = (e) => {
        e.stopPropagation();
        setSelectedLayer(layer);
    };

    const handlePlayClick = (e) => {
        e.stopPropagation();
        toggleLoop?.(layer.id);
    };

    const handleIntervalClick = (e) => {
        e.stopPropagation();
        const idx = LOOP_INTERVAL_PRESETS.indexOf(loopIntervalMs);
        const nextIdx = idx === -1 ? 0 : (idx + 1) % LOOP_INTERVAL_PRESETS.length;
        setLoopIntervalMs?.(layer.id, LOOP_INTERVAL_PRESETS[nextIdx]);
    };

    const handleDirectionClick = (e) => {
        e.stopPropagation();
        setLoopDirection?.(layer.id, loopDirection === 'rtl' ? 'ltr' : 'rtl');
    };

    const isLoading = useMemo(() => {
        if (loadingLayers.has(layer.id)) return true;
        if (layer.childIds) {
            return layer.childIds.some(id => loadingLayers.has(id));
        }
        return false;
    }, [loadingLayers, layer.id, layer.childIds]);

    const { hasLegend } = useWMSLegend();
    const layerHasLegend = hasLegend(layer);

    const warningContent = 'Al seleccionar un punto en el mapa, éste mostrará información de esta capa. Puedes cambiar la selección dando clic en la capa que necesites visualizar.';

    return (
        <div
            ref={itemRef}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            className={`
                rounded-[7px] border border-transparent hover:border-[#EAEFFA]
                transition-all hover:shadow-sm cursor-pointer overflow-hidden
                ${isSelected ? 'bg-[#F7F0FA] ring-1 ring-[#70308A]' : layer.visible ? 'bg-white' : 'bg-[#EFF3FC]'}
            `}
            onClick={handleClickOnLayer}
            onKeyDown={handleKeyActivate(handleClickOnLayer)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Tooltip
                content={isSelected ? warningContent : null}
                variant="warning"
                placement={isMobile ? 'top' : 'left'}
                disabled={!isSelected || download.menuOpen}
                triggerBlock
                triggerClassName="w-full"
            >
                <div className="flex flex-col gap-1.5 px-2 py-2 w-full">
                    <div className="flex items-center gap-2 min-h-8 w-full">
                        {isPinned && <PinBadge />}
                        {showHandle && <DragHandle dragHandleProps={dragHandleProps} />}
                        {!isSelected && !isMobile && isHovered ? (
                            <LayerInlineActions
                                visible={layer.visible}
                                isLoading={isLoading}
                                isLooping={isLooping}
                                canOpenModal={canOpenModal}
                                onToggleVisibility={handleToggleVisibilityClick}
                                onOpenDetails={handleSetSelectedLayerClick}
                                onRemove={handleRemoveClick}
                                slotMembership={slotMembership}
                                activeSlot={compareMode?.activeSlot}
                            />
                        ) : (
                            <EventoLayerIcon evento={layerEvento} />
                        )}
                        <LayerTitle name={layer.name} />
                        <GeometryTypeBadge type={layer.geometryType} />
                        <LayerBadge badge={layer.badge} />
                        {isLoading && !isLooping && (
                            <Loading visible={true} size="size-5" border="border-2" />
                        )}
                        {showSlotBadgeInTitle && (
                            <SlotBadge membership={slotMembership} onCycle={handleCycleSlot} layerId={layer.id} />
                        )}
                    </div>

                    {isExpanded && (
                        <>
                            <LayerDateControls
                                layerId={layer.id}
                                layer={layer}
                                rasterPeriodicity={rasterPeriodicity}
                                compareMode={compareMode}
                                slotMembership={slotMembership}
                                liveDateFilter={dateFilter}
                                isLooping={isLooping}
                                isLoading={isLoading}
                                canPlayLoop={canPlayLoop}
                                loopIntervalMs={loopIntervalMs}
                                loopDirection={loopDirection}
                                onPillClick={handleDateLabelClick}
                                onPlay={handlePlayClick}
                                onInterval={handleIntervalClick}
                                onDirection={handleDirectionClick}
                                onCycleSlot={handleCycleSlot}
                            />
                            <LayerActionsBar
                                layerId={layer.id}
                                visible={layer.visible}
                                isLoading={isLoading}
                                isLooping={isLooping}
                                canOpenModal={canOpenModal}
                                opacity={effectiveOpacity}
                                onToggleVisibility={handleToggleVisibilityClick}
                                onOpenDetails={handleSetSelectedLayerClick}
                                onChangeOpacity={(v) => setLayerOpacity?.(layer.id, v)}
                                onRemove={handleRemoveClick}
                                hasLegend={layerHasLegend}
                                slotMembership={slotMembership}
                                activeSlot={compareMode?.activeSlot}
                                onSwitchSlot={setActiveSlot}
                                canDownload={canDownload}
                                isDownloading={download.downloading}
                                onDownloadClick={handleDownloadClick}
                                downloadButtonRef={download.menuAnchorRef}
                            />
                            {canDownload && (
                                <>
                                    <LayerDownloadProgress
                                        open={download.downloading}
                                        progress={download.progress}
                                        onCancel={download.handleCancelDownload}
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
                            <LayerLegendInline
                                layer={layer}
                                compareMode={compareMode}
                                slotMembership={slotMembership}
                            />
                        </>
                    )}
                </div>
            </Tooltip>
        </div>
    );
};

export default ActiveLayerItem;
