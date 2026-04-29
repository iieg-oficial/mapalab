import { useState, useCallback, useEffect } from 'react';

export const useLayerOpacity = (getAllChildLayerIds, activeLayerIds) => {
    const [layerOpacities, setLayerOpacities] = useState(new Map());

    const setLayerOpacity = useCallback((layerId, opacity) => {
        const childIds = getAllChildLayerIds(layerId);
        const allIds = [layerId, ...childIds];

        setLayerOpacities(prev => {
            const newOpacities = new Map(prev);
            allIds.forEach(id => {
                newOpacities.set(id, opacity);
            });
            return newOpacities;
        });
    }, [getAllChildLayerIds]);

    const getLayerOpacity = useCallback((layerId) => {
        return layerOpacities.get(layerId) ?? 1;
    }, [layerOpacities]);

    const resetLayerOpacity = useCallback((layerId) => {
        const childIds = getAllChildLayerIds(layerId);
        const allIds = [layerId, ...childIds];

        setLayerOpacities(prev => {
            const newOpacities = new Map(prev);
            allIds.forEach(id => {
                newOpacities.delete(id);
            });
            return newOpacities;
        });
    }, [getAllChildLayerIds]);

    useEffect(() => {
        setLayerOpacities(prev => {
            const allActiveIds = new Set();
            activeLayerIds.forEach(id => {
                allActiveIds.add(id);
                const childIds = getAllChildLayerIds(id);
                childIds.forEach(cid => allActiveIds.add(cid));
            });

            const newOpacities = new Map();
            for (const [layerId, opacity] of prev.entries()) {
                if (allActiveIds.has(layerId)) {
                    newOpacities.set(layerId, opacity);
                }
            }

            if (newOpacities.size !== prev.size) {
                return newOpacities;
            }
            return prev;
        });
    }, [activeLayerIds, getAllChildLayerIds]);

    return {
        layerOpacities,
        setLayerOpacities,
        setLayerOpacity,
        getLayerOpacity,
        resetLayerOpacity
    };
};
