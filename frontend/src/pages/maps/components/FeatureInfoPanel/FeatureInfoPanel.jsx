import { useContext, useRef, useState } from 'react';
import MapsContext from '@contexts/MapsContext';
import { useOutsideClick } from '@hooks/useOutsideClick';
import { useViewportContainment } from '@hooks/useViewportContainment';
import { getFeatureConfig } from './config/featureDisplayConfig';
import { renderConfiguredFeature } from './utils/renderFeature.jsx';
import Icon from '@components/Icon';
import FeatureSummaryCard from './components/FeatureSummaryCard';

const FeatureInfoPanel = () => {
    const { selectedFeatureInfo, setSelectedFeatureInfo, clickPosition } = useContext(MapsContext);
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

    useOutsideClick([panelRef], handleClose);
    useViewportContainment(panelRef, [selectedFeatureInfo, clickPosition]);

    if (!selectedFeatureInfo) return null;

    const { results, isPolygonSelection } = selectedFeatureInfo;
    const totalFeatures = results ? results.reduce((total, result) => total + result.features.length, 0) : 0;
    const isSingleFeature = totalFeatures === 1;

    const positionStyle = clickPosition.getPositionStyle(
        isSingleFeature ? { x: 0, y: -15 } : { x: 15, y: 15 }
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

    const renderFeature = (feature, layerId, onClose) => {
        const config = getFeatureConfig(layerId);

        if (config) {
            const configuredContent = renderConfiguredFeature(feature.properties, config, onClose);
            if (configuredContent) {
                return configuredContent;
            }
        }

        return (
            <div className="text-xs space-y-2 relative p-4">
                {onClose && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="absolute right-2 top-2 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors z-10"
                    >
                        <Icon name="close" size={14} />
                    </div>
                )}
                {feature.properties && Object.keys(feature.properties).length > 0 ? (
                    Object.entries(feature.properties).map(([key, value]) => (
                        <div key={key} className="flex">
                            <span className="font-medium text-gray-600 w-32 shrink-0">
                                {key}:
                            </span>
                            <span className="text-gray-900 flex-1 break-words">
                                {value !== null && value !== undefined ? String(value) : 'N/A'}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500 italic">
                        No hay propiedades disponibles
                    </div>
                )}
                {feature.geometry && (
                    <div className="pt-2 border-t border-gray-100 mt-2">
                        <span className="text-xs font-medium text-gray-600">
                            Geometría: {feature.geometry.type}
                        </span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            ref={panelRef}
            className={`
                relative w-[239px] bg-transparent z-50 
                ${isSingleFeature ? '-translate-x-1/2 -translate-y-full' : ''}
            `}
            style={positionStyle}
        >
            <div
                className={`
                    absolute w-0 h-0 
                    ${isSingleFeature
                        ? 'bottom-[-12px] left-1/2 -translate-x-1/2 border-t-[12px] border-t-white border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent'
                        : 'drop-shadow-md -left-3 top-6 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[12px] border-r-[#EFF3FC]'
                    }
                `}
            ></div>

            <div className={`${totalFeatures <= 1 ? 'h-fit' : 'max-h-[60vh] overflow-y-auto'} [&::-webkit-scrollbar]:hidden [scrollbar-width:none] rounded-lg`}>
                <div>
                    {(!results || results.length === 0) ? (
                        <div className="bg-white rounded-[10px] p-4 shadow-[0px_6px_12px_#2F495C14] text-center">
                            <p className="text-sm text-gray-600 font-medium">
                                No hay información disponible
                            </p>
                        </div>
                    ) : (
                        <>
                            {isPolygonSelection && (
                                <FeatureSummaryCard
                                    results={results}
                                    isExpanded={isExpanded}
                                    isLoadingExpand={isLoadingExpand}
                                    onToggleExpand={handleToggleExpand}
                                    onClose={handleClose}
                                />
                            )}

                            {(!isPolygonSelection || isExpanded) && (
                                results.map((result, idx) => (
                                    <div key={idx}>
                                        {result.features.map((feature, featureIdx) => (
                                            <div
                                                key={featureIdx}
                                                className="bg-white rounded-[10px] border-b border-gray-100 shadow-[0px_6px_12px_#2F495C14] pb-2 mb-2 last:border-0 last:mb-0"
                                            >
                                                {renderFeature(
                                                    feature,
                                                    result.layerId,
                                                    () => handleRemoveFeature(result.layerId, featureIdx)
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeatureInfoPanel;