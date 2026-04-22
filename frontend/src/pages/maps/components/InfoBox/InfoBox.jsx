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
import { findLayerById, layers as allLayers } from '../../helpers/layers/index';
import LicenseTooltipContent from '@components/LicenseTooltipContent';
import SummaryCard from './components/SummaryCard';
import EmptySuggestions from './components/EmptySuggestions';
import ActionsToolbar from './components/ActionsToolbar';
import InfoBoxTools from './components/InfoBoxTools';
import InfoCard from './components/InfoCard';
import SwipeToRemove from './components/SwipeToRemove';
import WhatsNewModal from '../WhatsNewModal';

const InfoBox = () => {
    const { selectedFeatureInfo, setSelectedFeatureInfo, clickPosition, getSpecificFilter, activeLayerIds, filters } = useContext(MapsContext);
    const { isMobile } = useSider();
    const [whatsNewOpen, setWhatsNewOpen] = useState(false);
    const { selectAlternativeLayer } = useFeatureInfo();
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
    }, []);

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

    if (!selectedFeatureInfo) return null;

    const { results, isPolygonSelection, queriedLayerName, alternativeLayers } = selectedFeatureInfo;
    const totalFeatures = results ? results.reduce((total, result) => total + result.features.length, 0) : 0;
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

        const newResults = results.map(result => {
            if (result.layerId === layerId) {
                const newFeatures = [...result.features];
                newFeatures.splice(featureIndex, 1);
                return { ...result, features: newFeatures };
            }
            return result;
        }).filter(result => result.features.length > 0);

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

    const handleDownload = () => {
        if (results && results.length > 0) {
            downloadFeaturesAsCSV(results);
        }
    };

    const showToolbar = !hasNoResults && totalFeatures > 1;

    let globalCardIdx = 0;
    const featuresList = !showEmptySuggestions && !hasNoResults && (!isPolygonSelection || isExpanded) && (
        <div className="space-y-2">
            {results.map((result, idx) => (
                <div key={idx} className="space-y-2">
                    {result.features.map((feature, featureIdx) => {
                        globalCardIdx += 1;
                        const card = renderItem(
                            feature,
                            result.layerId,
                            () => handleRemoveFeature(result.layerId, featureIdx),
                            result.littleCard,
                            globalCardIdx,
                            totalFeatures
                        );
                        if (isMobile) {
                            return (
                                <SwipeToRemove
                                    key={featureIdx}
                                    onRemove={() => handleRemoveFeature(result.layerId, featureIdx)}
                                >
                                    {card}
                                </SwipeToRemove>
                            );
                        }
                        return <div key={featureIdx}>{card}</div>;
                    })}
                </div>
            ))}
        </div>
    );

    const mobileTools = [
        showToolbar && {
            id: 'download',
            icon: 'download',
            label: (
                <>
                    Descargar <span className="text-[#FF8300] font-bold">{totalFeatures}</span> {totalFeatures === 1 ? 'tarjeta' : 'tarjetas'}
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

                    <InfoBoxTools tools={mobileTools} className="pl-[13px] pr-4 pb-2" />

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
                relative bg-transparent z-50 flex items-start gap-2
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
                    <div
                        className={`${totalFeatures <= 1 ? 'h-fit' : 'max-h-[60vh] overflow-y-auto'} [&::-webkit-scrollbar]:hidden [scrollbar-width:none] rounded-lg transition-[pointer-events] duration-0`}
                        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
                    >
                        {featuresList}
                    </div>
                )}
            </div>

            <ActionsToolbar
                visible={showToolbar}
                onClear={handleClose}
                onDownload={handleDownload}
            />

            <WhatsNewModal isOpen={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />
        </div>
    );
};

export default InfoBox;
