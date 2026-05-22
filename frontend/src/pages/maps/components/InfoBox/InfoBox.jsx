import { useContext, useRef, useState, useEffect, useCallback } from 'react';
import MapsContext from '@contexts/MapsContext';
import { trackFeatureClick } from '@services/analyticsService';
import { useOutsideClick } from '@hooks/useOutsideClick';
import { useSider } from '@contexts/SiderContext';
import MobileSheet, { MobileSheetCloseButton } from '@components/MobileSheet';
import ScrollContainer from '@components/ScrollContainer';
import { useViewportContainment } from './hooks/useViewportContainment';
import { useFeatureInfo } from '../../hooks/useFeatureInfo';
import { renderCard } from './utils/renderCard.jsx';
import { downloadFeaturesAsCSV } from './utils/downloadFeatures';
import { useInfoBoxLazyLoad } from '../../hooks/useInfoBoxLazyLoad';
import { findLayerById } from '../../helpers/layers/utils/layerHelpers';
import LicenseTooltipContent from '@components/LicenseTooltipContent';
import SummaryCard from './components/SummaryCard';
import EmptySuggestions from './components/EmptySuggestions';
import ActionsToolbar from './components/ActionsToolbar';
import InfoBoxTools from './components/InfoBoxTools';
import InfoCard from './components/InfoCard';
import DismissGesture from './components/DismissGesture';
import WhatsNewModal from '../WhatsNewModal';
import { useColibriOpen } from '@hooks/useColibriOpen';

const InfoBox = () => {
    const openColibri = useColibriOpen();
    const { selectedFeatureInfo, setSelectedFeatureInfo, clickPosition, getSpecificFilter, activeLayerIds, filters, allLayers } = useContext(MapsContext);
    const { isMobile } = useSider();
    const [whatsNewOpen, setWhatsNewOpen] = useState(false);
    const { selectAlternativeLayer, loadMoreFeatures } = useFeatureInfo();
    const panelRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingExpand, setIsLoadingExpand] = useState(false);

    const handleClose = () => {
        setSelectedFeatureInfo(null);
        clickPosition.clearPosition();
        setIsExpanded(false);
        setIsLoadingExpand(false);
        setWhatsNewOpen(false);
    };

    const handleToggleExpand = () => {
        if (isLoadingExpand) return;

        if (!isExpanded) {
            setIsLoadingExpand(true);
            setTimeout(() => {
                setIsExpanded(true);
                setIsLoadingExpand(false);
            }, 50);
        } else {
            setIsExpanded(false);
        }
    };

    const handleSelectAlternative = (layer) => {
        selectAlternativeLayer(layer);
    };

    const handleAction = useCallback((action) => {
        if (action === 'whats_new') setWhatsNewOpen(true);
        if (action === 'report') openColibri({ source: 'iieg_marker' });
    }, [openColibri]);

    useOutsideClick([panelRef], isMobile ? undefined : handleClose);
    useViewportContainment(panelRef, [selectedFeatureInfo, clickPosition, isMobile]);

    useEffect(() => {
        setSelectedFeatureInfo(current => {
            if (!current?.alternativeLayers && !current?.alternativeResults) return current;
            return { ...current, alternativeLayers: null, alternativeResults: null };
        });
    }, [activeLayerIds, filters, setSelectedFeatureInfo]);

    const [interactive, setInteractive] = useState(false);

    useEffect(() => {
        const hasResults = selectedFeatureInfo?.results?.length > 0;
        const hasAlternatives = selectedFeatureInfo?.alternativeLayers?.length > 0;
        if (!hasResults && !hasAlternatives) {
            setInteractive(false);
            return;
        }
        if (hasResults) {
            const layerId = selectedFeatureInfo.results[0]?.layerId;
            if (layerId) trackFeatureClick(layerId);
        }
        setInteractive(false);
        const timer = setTimeout(() => setInteractive(true), 200);
        return () => clearTimeout(timer);
    }, [selectedFeatureInfo]);

    const lazyLoad = useInfoBoxLazyLoad({
        results: selectedFeatureInfo?.results,
        isPolygonSelection: selectedFeatureInfo?.isPolygonSelection,
        loadMoreFeatures,
    });

    if (!selectedFeatureInfo) return null;

    const { results, isPolygonSelection, queriedLayerName, alternativeLayers } = selectedFeatureInfo;
    const { sentinelRef: loadMoreSentinelRef, loadingMore, totalAvailable, totalFeatures, hasMore, downloadDisplayCount, downloadShowsPlus, downloadTooltipText, enrichResultsForDownload } = lazyLoad;
    const isSingleFeature = totalFeatures === 1;
    const hasNoResults = !results || results.length === 0 || totalFeatures === 0;
    const hasAlternatives = alternativeLayers && alternativeLayers.length > 0;
    const showEmptySuggestions = hasNoResults && !isPolygonSelection && (queriedLayerName || hasAlternatives);
    const showNoLayerSelected = hasNoResults && !isPolygonSelection && !queriedLayerName && !hasAlternatives;

    const positionStyle = clickPosition.getPositionStyle(
        isSingleFeature ? { x: 0, y: -12 } : { x: 12, y: -24 }
    );

    const handleRemoveFeature = (layerId, featureIndex) => {
        if (!results) return;

        const REFILL_PAGE = 50;

        const newResults = results.map(result => {
            if (result.layerId === layerId) {
                const removed = result.features[featureIndex];
                const newFeatures = [...result.features];
                newFeatures.splice(featureIndex, 1);
                const cache = result.cachedFeatures || result.features;
                const newCache = cache.filter(f => f !== removed && (removed?.id == null || f.id !== removed.id));

                let nextFeatures = newFeatures;
                let nextDisplayCap = result.displayCap ?? newFeatures.length;
                if (newFeatures.length === 0 && newCache.length > 0) {
                    nextFeatures = newCache.slice(0, Math.min(REFILL_PAGE, newCache.length));
                    nextDisplayCap = nextFeatures.length;
                }

                return {
                    ...result,
                    features: nextFeatures,
                    cachedFeatures: newCache,
                    totalAvailable: newCache.length,
                    displayCap: nextDisplayCap,
                };
            }
            return result;
        }).filter(result => {
            const cacheLen = (result.cachedFeatures || []).length;
            return result.features.length > 0 || cacheLen > 0;
        });

        if (newResults.length === 0) {
            setSelectedFeatureInfo(null);
            clickPosition.clearPosition();
        } else {
            setSelectedFeatureInfo({
                ...selectedFeatureInfo,
                results: newResults
            });
        }
    };

    const renderItem = (feature, layerId, onClose, resultLittleCard, cardIndex = null, cardTotal = null) => {
        const config = resultLittleCard || findLayerById(layerId, allLayers)?.littleCard;
        const dateValue = getSpecificFilter?.(layerId, 'date');
        return renderCard(feature.properties, config, onClose, layerId, feature.id, handleAction, isMobile ? 'mobile' : 'desktop', cardIndex, cardTotal, dateValue);
    };

    const handleDownload = async () => {
        if (!results || results.length === 0) return;
        const enriched = await enrichResultsForDownload();
        downloadFeaturesAsCSV(enriched, allLayers);
    };

    const showToolbar = !hasNoResults && totalFeatures > 1;

    let globalCardIdx = 0;
    const cardTotal = totalAvailable > 0 ? totalAvailable : totalFeatures;
    const featuresList = !showEmptySuggestions && !hasNoResults && (!isPolygonSelection || isExpanded) && (
        <div className="space-y-2">
            {results.map((result) => (
                <div key={result.layerId} className="space-y-2">
                    {result.features.map((feature, featureIdx) => {
                        globalCardIdx += 1;
                        const stableKey = feature.id ?? `${result.layerId}-${featureIdx}`;
                        const card = renderItem(
                            feature,
                            result.layerId,
                            () => handleRemoveFeature(result.layerId, featureIdx),
                            result.littleCard,
                            globalCardIdx,
                            cardTotal
                        );
                        if (isMobile) {
                            return (
                                <DismissGesture
                                    key={stableKey}
                                    onRemove={() => handleRemoveFeature(result.layerId, featureIdx)}
                                >
                                    {card}
                                </DismissGesture>
                            );
                        }
                        return <div key={stableKey}>{card}</div>;
                    })}
                </div>
            ))}
            {hasMore && (
                <div ref={loadMoreSentinelRef} className="py-3 text-center text-[11px]/[14px] font-garet text-[#7e8a91]">
                    {loadingMore ? 'Cargando mas...' : 'Sigue desplazando para cargar mas'}
                </div>
            )}
        </div>
    );


    const mobileTools = [
        showToolbar && {
            id: 'download',
            icon: 'download',
            label: (
                <>
                    Descargar <span className="text-[#FF8300] font-bold">{downloadDisplayCount}{downloadShowsPlus ? '+' : ''}</span> {downloadDisplayCount === 1 ? 'tarjeta' : 'tarjetas'}
                </>
            ),
            tooltip: <LicenseTooltipContent />,
            onClick: handleDownload
        }
    ];

    if (isMobile) {
        return (
            <>
                <MobileSheet open={!!selectedFeatureInfo} onClose={handleClose}>
                    <div className="px-4 pt-3 pb-1 flex items-center gap-2 shrink-0">
                        <h3 className="font-garet font-bold text-[13px]/[16px] text-[#2E4372]">
                            Información
                        </h3>
                        <MobileSheetCloseButton onClick={handleClose} />
                    </div>

                    <div className="flex items-center pl-[13px] pr-4 pb-2 gap-3">
                        <InfoBoxTools tools={mobileTools} layerId={results?.[0]?.layerId || null} />
                    </div>

                    <ScrollContainer
                        className="flex-1 px-3 pb-3 transition-[pointer-events] duration-0"
                        overlayFade
                        overlayColor="#F9FBFF"
                        clickableArrows
                        minItemsForClick={3}
                        itemCount={totalFeatures}
                        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
                    >
                        <div className="space-y-2">
                            <EmptySuggestions
                                visible={showEmptySuggestions}
                                queriedLayerName={queriedLayerName}
                                alternativeLayers={alternativeLayers}
                                onSelectLayer={handleSelectAlternative}
                                onClose={handleClose}
                                variant="mobile"
                            />

                            {showNoLayerSelected && (
                                <InfoCard variant="mobile">
                                    <p className="text-[12px]/[16px] text-[#465055] font-medium text-center px-5 py-4">
                                        Selecciona una capa en el panel de capas activas para mostrar información
                                    </p>
                                </InfoCard>
                            )}

                            <SummaryCard
                                visible={isPolygonSelection}
                                results={results || []}
                                isExpanded={isExpanded}
                                isLoadingExpand={isLoadingExpand}
                                onToggleExpand={handleToggleExpand}
                                onClose={handleClose}
                                variant="mobile"
                            />

                            {featuresList}
                        </div>
                    </ScrollContainer>
                </MobileSheet>
                <WhatsNewModal isOpen={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />
            </>
        );
    }

    return (
        <div
            ref={panelRef}
            className={`
                relative bg-transparent z-0 flex items-stretch gap-2
                ${isSingleFeature ? '-translate-x-1/2 -translate-y-full' : ''}
            `}
            style={positionStyle}
        >
            <div className="relative w-[239px]">
                <div
                    className={`
                        absolute size-0
                        ${isSingleFeature
            ? 'bottom-[-12px] left-1/2 -translate-x-1/2 border-t-[12px] border-t-white border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent'
            : 'drop-shadow-md -left-3 top-6 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[12px] border-r-[#EFF3FC]'
        }
                    `}
                />

                <EmptySuggestions
                    visible={showEmptySuggestions}
                    queriedLayerName={queriedLayerName}
                    alternativeLayers={alternativeLayers}
                    onSelectLayer={handleSelectAlternative}
                    onClose={handleClose}
                />

                {showNoLayerSelected && (
                    <InfoCard>
                        <p className="text-[12px]/[16px] text-[#465055] font-medium text-center p-4">
                            Selecciona una capa en el panel de capas activas para mostrar información
                        </p>
                    </InfoCard>
                )}

                <SummaryCard
                    visible={isPolygonSelection}
                    results={results || []}
                    isExpanded={isExpanded}
                    isLoadingExpand={isLoadingExpand}
                    onToggleExpand={handleToggleExpand}
                    onClose={handleClose}
                />

                {featuresList && (
                    totalFeatures <= 1 ? (
                        <div
                            className="h-fit rounded-lg transition-[pointer-events] duration-0"
                            style={{ pointerEvents: interactive ? 'auto' : 'none' }}
                        >
                            {featuresList}
                        </div>
                    ) : (
                        <ScrollContainer
                            className="max-h-[60vh] rounded-lg transition-[pointer-events] duration-0"
                            overlayFade
                            overlayColor="#F9FBFF"
                            clickableArrows
                            minItemsForClick={3}
                            itemCount={totalFeatures}
                            style={{ pointerEvents: interactive ? 'auto' : 'none' }}
                        >
                            {featuresList}
                        </ScrollContainer>
                    )
                )}
            </div>

            <div className="flex flex-col items-center justify-between pb-1">
                <ActionsToolbar
                    visible={showToolbar}
                    onClear={handleClose}
                    onDownload={handleDownload}
                    downloadCount={downloadDisplayCount}
                    downloadShowsPlus={downloadShowsPlus}
                    downloadTooltip={downloadTooltipText}
                />
            </div>

            <WhatsNewModal isOpen={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />
        </div>
    );
};

export default InfoBox;
