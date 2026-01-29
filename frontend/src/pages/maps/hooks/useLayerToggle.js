import { useCallback } from 'react';

export const useLayerToggle = ({
    setActiveLayerIds,
    getAllChildLayerIds
}) => {
    const handleToggleLayer = useCallback((layerId, isActive) => {
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
    }, [setActiveLayerIds, getAllChildLayerIds]);

    return { handleToggleLayer };
};
