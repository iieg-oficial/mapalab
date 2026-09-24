import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { trackLayerDetailOpen, trackPeriodicityAdvanced } from '@services/analyticsService';
import { useLayerMetadata, useMetadataContext } from '../../hooks/useLayerMetadata';
import { useNumeraliaPanel } from '@contexts/NumeraliaPanelContext';
import { useLayerPeriodicity } from '../../hooks/useLayerPeriodicity';
import { useLayerDownload } from '../../hooks/useLayerDownload';
import { useSider } from '@contexts/SiderContext';
import MapsContext from '@contexts/MapsContext';
import { useEventoContext } from '@hooks/useEvento';
import { findLayerDef, findLayerTheme, findWMSConfig } from '../../helpers/wmsConfig';
import { fetchGeometryType } from '../../../../utils/featureInfoUtils';
import { formatDateString } from '../../helpers/dateFilterHelpers';
import { slotLabel } from '../../helpers/swipeTheme';
import { useSlotPeriodicity } from '../../hooks/useSlotPeriodicity';
import PeriodicitySection from './components/PeriodicitySection';
import OpacityControl from './components/OpacityControl';
import InfoCard from './components/InfoCard';
import NumeraliaSection from './components/NumeraliaSection';
import LayerInfoSections from './components/LayerInfoSections';
import LayerDetailHeader from './components/LayerDetailHeader';
import DownloadButton from './components/DownloadButton';
import DownloadMenu from './components/DownloadMenu';
import Icon from '@components/Icon';
import Logo from '@components/Logo';
import Loading from '@components/Loading';

const LayerDetailModal = () => {
    const {
        selectedLayer, setSelectedLayer, getFilter, getSpecificFilter,
        getLayerOpacity, setLayerOpacity, allLayers, compareMode, municipioMode,
    } = useContext(MapsContext);
    const { activeEvento, getAliasByLayerId } = useEventoContext();

    const layerDef = useMemo(() => {
        if (!selectedLayer?.id) return null;
        return findLayerDef(selectedLayer.id, allLayers);
    }, [selectedLayer?.id, allLayers]);
    const themeNode = useMemo(() => {
        if (!selectedLayer?.id) return null;
        return findLayerTheme(selectedLayer.id, allLayers);
    }, [selectedLayer?.id, allLayers]);
    const rasterPeriodicity = layerDef?.rasterPeriodicity || null;
    const hidePeriodicity = layerDef?.hidePeriodicity || false;
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    const { metadata, loading } = useLayerMetadata(selectedLayer?.id, useMetadataContext(municipioMode));
    const { detach } = useNumeraliaPanel();
    const hasNumeralia = Boolean(metadata?.numeralia?.some(s => s.nombre || s.valor));
    const handleDetach = () => { detach?.(selectedLayer?.id); setSelectedLayer(null); };
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

    const slotPeriodicity = useSlotPeriodicity(selectedLayer?.id);
    const periodicitySlots = slotMembership === 'AB' ? ['A', 'B'] : [slotMembership];

    useEffect(() => {
        if (selectedLayer?.id && !selectedLayer?.silent) trackLayerDetailOpen(selectedLayer.id);
    }, [selectedLayer?.id, selectedLayer?.silent]);

    useEffect(() => {
        if (isAdvancedMode && selectedLayer?.id) trackPeriodicityAdvanced(selectedLayer.id);
    }, [isAdvancedMode, selectedLayer?.id]);

    if (!selectedLayer) return null;

    return (
        <div className="fixed top-4 sm:top-4 bottom-0 right-0 sm:right-4 z-30 w-full sm:w-[643px] pointer-events-none">
            <div className={`
                h-full bg-white shadow-[0_5px_20px_#1A26641A] backdrop-blur-sm overflow-y-auto pointer-events-auto rounded-t-[20px] rounded-b-none
                scrollbar-thin scrollbar-thumb-gray-400
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
                                {getAliasByLayerId?.(selectedLayer.id) || selectedLayer.name || selectedLayer.label || layerDef?.label || 'Capa sin nombre'}
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

                            <NumeraliaSection
                                numeralia={metadata?.numeralia}
                                pie={metadata?.nombre_pie_numeralia}
                                ambito={metadata?.ambito}
                                onDetach={hasNumeralia ? handleDetach : null}
                            />

                            {hasPeriodicity && periodicitySlots.map((slot) => {
                                const lado = slotPeriodicity.forSlot(slot);
                                return (
                                    <PeriodicitySection
                                        key={slot || 'live'}
                                        layerId={selectedLayer.id}
                                        slot={slot || undefined}
                                        label={slot ? `Lado ${slotLabel(slot)}` : null}
                                        periodicity={periodicity}
                                        rasterPeriodicity={rasterPeriodicity}
                                        periodicityLoading={periodicityLoading}
                                        isAdvancedMode={isAdvancedMode}
                                        onAdvancedToggle={onAdvancedToggle}
                                        onFilterApply={lado.apply}
                                        onClearFilter={lado.clear}
                                        onClearDateFilter={lado.clear}
                                        onExpandedYearChange={lado.onExpandedYearChange}
                                        singleSelectOnly={singleSelectOnly}
                                        hasDateFilter={lado.hasFilter}
                                        showLoopControls
                                        canPlay={lado.canPlay}
                                        isLoopPlaying={lado.isPlaying}
                                        layerIntervalMs={slotPeriodicity.intervalMs}
                                        layerDirection={slotPeriodicity.direction}
                                        onSetLoopIntervalMs={slotPeriodicity.setLoopIntervalMs}
                                        onSetLoopDirection={slotPeriodicity.setLoopDirection}
                                        onTogglePeriodicityLoop={lado.toggleLoop}
                                        getSpecificFilterOverride={lado.getFilter}
                                        loopDisabled={lado.loopDisabled}
                                        loopDisabledHint={lado.loopDisabledHint}
                                    />
                                );
                            })}


                            <LayerInfoSections metadata={metadata} layerName={selectedLayer.name} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LayerDetailModal;
