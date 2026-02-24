import { useContext, useRef, useState, useEffect } from 'react';
import MapsContext from '@contexts/MapsContext';
import { trackFeatureClick } from '@services/analyticsService';
import { useOutsideClick } from '@hooks/useOutsideClick';
import { useViewportContainment } from './hooks/useViewportContainment';
import { useFeatureInfo } from '../../hooks/useFeatureInfo';
import { renderCard } from './utils/renderCard.jsx';
import { downloadFeaturesAsCSV } from './utils/downloadFeatures';
import { findLayerById, layers as allLayers } from '../../helpers/layers/index';
import SummaryCard from './components/SummaryCard';
import EmptySuggestions from './components/EmptySuggestions';
import ActionsToolbar from './components/ActionsToolbar';

const InfoBox = () => {
    const { selectedFeatureInfo, setSelectedFeatureInfo, clickPosition, getSpecificFilter } = useContext(MapsContext);
    const { selectAlternativeLayer } = useFeatureInfo();
    const panelRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingExpand, setIsLoadingExpand] = useState(false);

    const handleClose = () => {
        setSelectedFeatureInfo(null);
        clickPosition.clearPosition();
        setIsExpanded(false);
        setIsLoadingExpand(false);
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
        handleClose();
    };

    useOutsideClick([panelRef], handleClose);
    useViewportContainment(panelRef, [selectedFeatureInfo, clickPosition]);

    useEffect(() => {
        if (!selectedFeatureInfo?.results?.length) return;
        const layerId = selectedFeatureInfo.results[0]?.layerId;
        if (layerId) trackFeatureClick(layerId);
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

    const renderItem = (feature, layerId, onClose) => {
        const layerNode = findLayerById(layerId, allLayers);
        const rawConfig = layerNode?.littleCard;
        const config = typeof rawConfig === 'function'
            ? rawConfig(getSpecificFilter?.(layerId, 'date'))
            : rawConfig;
        return renderCard(feature.properties, config, onClose, layerId);
    };

    const handleDownload = () => {
        if (results && results.length > 0) {
            downloadFeaturesAsCSV(results);
        }
    };

    const showToolbar = !hasNoResults && totalFeatures > 1;

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
                    <div className="bg-white rounded-[10px] p-4 shadow-[0px_6px_12px_#2F495C14] text-center">
                        <p className="text-[12px]/[16px] text-[#465055] font-medium">
                            Selecciona una capa en el panel de capas activas para mostrar información
                        </p>
                    </div>
                )}

                <SummaryCard
                    visible={isPolygonSelection}
                    results={results || []}
                    isExpanded={isExpanded}
                    isLoadingExpand={isLoadingExpand}
                    onToggleExpand={handleToggleExpand}
                    onClose={handleClose}
                />

                {!showEmptySuggestions && !hasNoResults && (!isPolygonSelection || isExpanded) && (
                    <div className={`${totalFeatures <= 1 ? 'h-fit' : 'max-h-[60vh] overflow-y-auto'} [&::-webkit-scrollbar]:hidden [scrollbar-width:none] rounded-lg`}>
                        <div className="space-y-2">
                            {results.map((result, idx) => (
                                <div key={idx} className="space-y-2">
                                    {result.features.map((feature, featureIdx) => (
                                        <div
                                            key={featureIdx}
                                            className="bg-white rounded-[10px] shadow-[0px_6px_12px_#2F495C14] pb-2"
                                        >
                                            {renderItem(
                                                feature,
                                                result.layerId,
                                                () => handleRemoveFeature(result.layerId, featureIdx)
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ActionsToolbar
                visible={showToolbar}
                onClear={handleClose}
                onDownload={handleDownload}
            />
        </div>
    );
};

export default InfoBox;