import { useState, useCallback, useEffect } from 'react';
import { SERVICE_WMS } from '../helpers/serviceMode';

export const useLayerServiceMode = (getAllChildLayerIds, activeLayerIds) => {
    const [layerServiceModes, setLayerServiceModes] = useState(new Map());
    const [vectorRejections, setVectorRejections] = useState(new Map());
    const [hexbinStats, setHexbinStats] = useState(new Map());

    const applyHexbinStats = useCallback((layerIds, stats) => {
        setHexbinStats(prev => {
            const next = new Map(prev);
            (layerIds || []).forEach(id => next.set(id, stats));
            return next;
        });
    }, []);

    const getHexbinStats = useCallback((layerId) => {
        return hexbinStats.get(layerId) ?? null;
    }, [hexbinStats]);

    const clearVectorRejection = useCallback((layerId) => {
        setVectorRejections(prev => {
            if (!prev.has(layerId)) return prev;
            const next = new Map(prev);
            next.delete(layerId);
            return next;
        });
    }, []);

    const setServiceMode = useCallback((layerId, mode) => {
        clearVectorRejection(layerId);
        setLayerServiceModes(prev => {
            const next = new Map(prev);
            if (!mode || mode === SERVICE_WMS) {
                if (!next.has(layerId)) return prev;
                next.delete(layerId);
            } else {
                if (next.get(layerId) === mode) return prev;
                next.set(layerId, mode);
            }
            return next;
        });
    }, [clearVectorRejection]);

    const rejectVectorMode = useCallback((layerId, reason) => {
        setLayerServiceModes(prev => {
            if (!prev.has(layerId)) return prev;
            const next = new Map(prev);
            next.delete(layerId);
            return next;
        });
        setVectorRejections(prev => new Map(prev).set(layerId, reason));
    }, []);

    const getVectorRejection = useCallback((layerId) => {
        return vectorRejections.get(layerId) ?? null;
    }, [vectorRejections]);

    const getServiceMode = useCallback((layerId) => {
        return layerServiceModes.get(layerId) ?? SERVICE_WMS;
    }, [layerServiceModes]);

    useEffect(() => {
        if (!activeLayerIds?.length) return;

        setLayerServiceModes(prev => {
            if (prev.size === 0) return prev;

            const allActiveIds = new Set();
            (activeLayerIds || []).forEach(id => {
                allActiveIds.add(id);
                getAllChildLayerIds(id).forEach(childId => allActiveIds.add(childId));
            });

            const next = new Map();
            for (const [layerId, mode] of prev.entries()) {
                if (allActiveIds.has(layerId)) {
                    next.set(layerId, mode);
                }
            }

            return next.size === prev.size ? prev : next;
        });
    }, [activeLayerIds, getAllChildLayerIds]);

    return {
        layerServiceModes,
        setLayerServiceModes,
        setServiceMode,
        getServiceMode,
        rejectVectorMode,
        getVectorRejection,
        clearVectorRejection,
        hexbinStats,
        applyHexbinStats,
        getHexbinStats
    };
};
