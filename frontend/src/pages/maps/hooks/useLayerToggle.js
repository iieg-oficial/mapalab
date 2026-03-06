import { useCallback } from 'react';
import { trackLayerToggle } from '@services/analyticsService';

export const useLayerToggle = ({
    setActiveLayerIds,
    getAllChildLayerIds,
    findLayerById,
    setSelectedLayer
}) => {
    const handleToggleLayer = useCallback((layerId, isActive, skipAnalytics = false) => {
        if (!skipAnalytics) trackLayerToggle(layerId, isActive);
        setActiveLayerIds(prevActiveIds => {
            const childLayerIds = getAllChildLayerIds(layerId);
            const allRelatedIds = [layerId, ...childLayerIds];

            if (isActive) {
                const filteredIds = prevActiveIds.filter(id => !allRelatedIds.includes(id));
                return [...allRelatedIds, ...filteredIds];
            } else {
                return prevActiveIds.filter(id => !allRelatedIds.includes(id));
            }
        });
        if (isActive) {
            const layer = findLayerById(layerId);
            if (layer) setSelectedLayer(layer);
        }
    }, [setActiveLayerIds, getAllChildLayerIds, findLayerById, setSelectedLayer]);

    return { handleToggleLayer };
};
