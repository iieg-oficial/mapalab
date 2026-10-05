import { useContext, useRef, useState, useEffect, useCallback } from 'react';
import MapsContext from '@contexts/MapsContext';
import { trackFeatureClick } from '@services/analyticsService';
import { useOutsideClick } from '@hooks/useOutsideClick';
import { useSider } from '@contexts/SiderContext';
import { useCaminar } from '@contexts/CaminarContext';
import MobileSheet, { MobileSheetCloseButton } from '@components/MobileSheet';
import ScrollContainer from '@components/ScrollContainer';
import { useViewportContainment } from './hooks/useViewportContainment';
import { useDraggablePanel } from './hooks/useDraggablePanel';
import InfoBoxArrow, { ARROW_TIP } from './components/InfoBoxArrow';
import { useFeatureInfo } from '../../hooks/useFeatureInfo';
import { renderCard } from './utils/renderCard.jsx';
import { useDescargaDeInfoBox } from './hooks/useDescargaDeInfoBox';
import { pedirDescargaDeSeleccion } from '@pages/maps/helpers/descargaSeleccion';
import { useInfoBoxLazyLoad } from '../../hooks/useInfoBoxLazyLoad';
import { findLayerById } from '../../helpers/layers/utils/layerHelpers';
import { centerOnResults, ubicacionDeFeature } from '../../helpers/featureGeometry';
import { trackInfoBoxAction } from '@services/analyticsService';
import LicenseTooltipContent from '@components/LicenseTooltipContent';
import SummaryCard from './components/SummaryCard';
import EmptySuggestions from './components/EmptySuggestions';
import ActionsToolbar from './components/ActionsToolbar';
import InfoBoxTools from './components/InfoBoxTools';
import InfoCard from './components/InfoCard';
import DismissGesture from './components/DismissGesture';
import WhatsNewModal from '../WhatsNewModal';
import { useColibriOpen } from '@hooks/useColibriOpen';
import PanelMedicionSeleccion from '../MeasurementTools/PanelMedicionSeleccion';

const InfoBox = ({ forceDesktop = false, embed = false }) => {
    const openColibri = useColibriOpen();
    const { entrar: entrarCaminata } = useCaminar();
    const { selectedFeatureInfo, setSelectedFeatureInfo, clickPosition, getSpecificFilter, activeLayerIds, filters, allLayers, mapRef, paneMapInstances, compareMode } = useContext(MapsContext);
    const { isMobile: siderIsMobile } = useSider();
    const isMobile = forceDesktop ? false : siderIsMobile;
    const [whatsNewOpen, setWhatsNewOpen] = useState(false);
    const { selectAlternativeLayer, loadMoreFeatures, loadMorePolygonFeatures, pedirParaDescarga } = useFeatureInfo();
    const panelRef = useRef(null);
    const cardRef = useRef(null);
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
            const sinElementos = selectedFeatureInfo?.isPolygonSelection && !selectedFeatureInfo?.results?.length;
            Promise.resolve(sinElementos ? loadMorePolygonFeatures() : null).catch(() => null).finally(() => setTimeout(() => {
                setIsExpanded(true);
                setIsLoadingExpand(false);
            }, 50));
        } else {
            setIsExpanded(false);
        }
    };

    const handleSelectAlternative = (layer) => {
        trackInfoBoxAction('select_alternative', layer.id);
        selectAlternativeLayer(layer);
    };

    const handleAction = useCallback((action) => {
        if (action === 'whats_new') setWhatsNewOpen(true);
        if (action === 'report') openColibri({ source: 'iieg_marker' });
        if (action === 'caminar') entrarCaminata();
    }, [openColibri, entrarCaminata]);

    const lazyLoad = useInfoBoxLazyLoad({
        results: selectedFeatureInfo?.results,
        isPolygonSelection: selectedFeatureInfo?.isPolygonSelection,
        polygonHasMore: selectedFeatureInfo?.hasMore,
        loadMoreFeatures,
        loadMorePolygonFeatures,
    });
    const descarga = useDescargaDeInfoBox({ selectedFeatureInfo, lazyLoad, allLayers, pedirParaDescarga });

    const centrado = !!selectedFeatureInfo?.centrado;
    const baseTransform = centrado
        ? 'translate(-50%, -50%)'
        : (lazyLoad.totalFeatures === 1 ? 'translate(-50%, -100%)' : '');
    const { isDragging, handleProps: moveHandleProps, reset: resetDrag } = useDraggablePanel({ panelRef, baseTransform });

    useOutsideClick([panelRef], isMobile ? undefined : handleClose);
    useViewportContainment(panelRef, [selectedFeatureInfo, clickPosition, isMobile], 10, isDragging);

    useEffect(() => {
        resetDrag();
    }, [selectedFeatureInfo?.lngLat?.lng, selectedFeatureInfo?.lngLat?.lat, resetDrag]);

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

    if (!selectedFeatureInfo) return null;

    const { results, isPolygonSelection, queriedLayerName, queriedLayerId, alternativeLayers, enBorde = 0 } = selectedFeatureInfo;
    const { sentinelRef: loadMoreSentinelRef, loadingMore, totalAvailable, totalFeatures, hasMore } = lazyLoad;
    const isSingleFeature = totalFeatures === 1;
    const hasNoResults = !results || results.length === 0 || totalFeatures === 0;
    const hasAlternatives = alternativeLayers && alternativeLayers.length > 0;
    const geometriaMedida = selectedFeatureInfo.medicion || (isPolygonSelection ? selectedFeatureInfo.polygonGeometry : null);
    const soloMedicion = !!geometriaMedida && hasNoResults;
    const showEmptySuggestions = hasNoResults && !isPolygonSelection && !soloMedicion && (queriedLayerName || hasAlternatives);
    const showNoLayerSelected = hasNoResults && !isPolygonSelection && !soloMedicion && !queriedLayerName && !hasAlternatives;

    const positionStyle = centrado
        ? { position: 'fixed', left: `${window.innerWidth / 2}px`, top: `${window.innerHeight / 2}px` }
        : clickPosition.getPositionStyle(
            isSingleFeature ? { x: 0, y: -ARROW_TIP } : { x: ARROW_TIP, y: -24 }
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
        return renderCard(feature.properties, config, onClose, layerId, feature.id, handleAction, isMobile ? 'mobile' : 'desktop', cardIndex, cardTotal, dateValue, ubicacionDeFeature(feature, selectedFeatureInfo?.lngLat));
    };

    const descargarMapaDeSeleccion = () => pedirDescargaDeSeleccion(selectedFeatureInfo?.polygonGeometry);

    const handleCenterGroup = () => {
        const activeMap = compareMode?.active ? paneMapInstances?.[0] : mapRef?.current;
        if (centerOnResults({ activeMap, results, clickPosition })) {
            trackInfoBoxAction('center_group', results[0]?.layerId || null);
        }
    };

    const showCenterButton = !hasNoResults && !embed;
    const showMultiActions = !hasNoResults && totalFeatures > 1;
    const showToolbar = showCenterButton || showMultiActions || soloMedicion;
    const cardHandleProps = embed ? { ...moveHandleProps, style: { touchAction: 'none' } } : {};


    let globalCardIdx = 0;
    const polygonMatched = isPolygonSelection ? (selectedFeatureInfo?.matched || 0) : 0;
    const cardTotal = polygonMatched > totalFeatures
        ? polygonMatched
        : (totalAvailable > 0 ? totalAvailable : totalFeatures);
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
        showCenterButton && {
            id: 'center_group',
            icon: 'center_group',
            label: 'Centrar selección',
            tooltip: 'Centrar selección en el mapa',
            onClick: handleCenterGroup
        },
        descarga.onDownload && {
            id: 'download',
            icon: 'download',
            label: (
                <>
                    Descargar <span className="text-orange font-bold">{descarga.downloadCount}{descarga.downloadShowsPlus ? '+' : ''}</span> {descarga.downloadCount === 1 ? 'tarjeta' : 'tarjetas'}
                </>
            ),
            tooltip: <LicenseTooltipContent />,
            onClick: descarga.onDownload
        },
        isPolygonSelection && {
            id: 'descargar_mapa',
            icon: 'poligono',
            label: 'Descargar el mapa de esta selección',
            tooltip: 'Descargar la imagen del mapa recortada a esta selección',
            onClick: descargarMapaDeSeleccion
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
                                queriedLayerId={queriedLayerId}
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

                            {geometriaMedida && <PanelMedicionSeleccion geometria={geometriaMedida} />}

                            <SummaryCard
                                visible={isPolygonSelection && (!hasNoResults || enBorde > 0 || !!selectedFeatureInfo?.resumen?.length)}
                                enBorde={enBorde}
                                results={results || []}
                                resumen={selectedFeatureInfo?.resumen}
                                matched={selectedFeatureInfo?.matched || 0}
                                isExpanded={isExpanded}
                                isLoadingExpand={isLoadingExpand}
                                onToggleExpand={handleToggleExpand}
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
        <>
            <div
                ref={panelRef}
                className={`relative w-fit bg-transparent z-5 ${isSingleFeature ? '' : 'flex items-stretch gap-2'}`}
                style={positionStyle}
            >
                <div ref={cardRef} className={`relative w-[239px] max-h-[calc(100dvh-20px)] overflow-y-auto overscroll-contain${embed ? (isDragging ? ' cursor-grabbing' : ' cursor-grab') : ''}`} {...cardHandleProps}>
                    <EmptySuggestions
                        visible={showEmptySuggestions}
                        queriedLayerName={queriedLayerName}
                        queriedLayerId={queriedLayerId}
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

                    {geometriaMedida && <PanelMedicionSeleccion geometria={geometriaMedida} className="mb-2" />}

                    <SummaryCard
                        visible={isPolygonSelection && (!hasNoResults || enBorde > 0 || !!selectedFeatureInfo?.resumen?.length)}
                        enBorde={enBorde}
                        results={results || []}
                        resumen={selectedFeatureInfo?.resumen}
                        matched={selectedFeatureInfo?.matched || 0}
                        isExpanded={isExpanded}
                        isLoadingExpand={isLoadingExpand}
                        onToggleExpand={handleToggleExpand}
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

                {showToolbar && (
                    <div className={
                        isSingleFeature
                            ? 'absolute left-full top-0 ml-2 flex flex-col items-center'
                            : 'flex flex-col items-center justify-between pb-1'
                    }>
                        <ActionsToolbar
                            onClear={showMultiActions || soloMedicion ? handleClose : null}
                            moveHandleProps={embed ? null : moveHandleProps}
                            isMoving={isDragging}
                            onDownload={descarga.onDownload}
                            onDownloadMap={isPolygonSelection ? descargarMapaDeSeleccion : null}
                            onCenter={showCenterButton ? handleCenterGroup : null}
                            downloadCount={descarga.downloadCount}
                            downloadShowsPlus={descarga.downloadShowsPlus}
                            downloadTooltip={descarga.downloadTooltip}
                        />
                    </div>
                )}

                <WhatsNewModal isOpen={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />
            </div>
            {!showEmptySuggestions && !showNoLayerSelected && !isPolygonSelection && !hasNoResults && (
                <InfoBoxArrow
                    panelRef={cardRef}
                    mapInstance={compareMode?.active ? paneMapInstances?.[compareMode.activeSlot ?? 0] : mapRef?.current}
                    lngLat={selectedFeatureInfo?.lngLat}
                />
            )}
        </>
    );
};

export default InfoBox;
