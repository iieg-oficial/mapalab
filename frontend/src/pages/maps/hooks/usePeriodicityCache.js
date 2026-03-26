import { useState, useCallback, useRef, useEffect } from 'react';
import { getLayersPeriodicities } from '@services/layerMetadataService';

export const usePeriodicityCache = (activeLayerIds) => {
    const [cache, setCache] = useState({});
    const [loading, setLoading] = useState(new Set());
    const fetchedRef = useRef(new Set());

    useEffect(() => {
        const missing = activeLayerIds.filter(id => !fetchedRef.current.has(id));
        if (missing.length === 0) return;

        missing.forEach(id => fetchedRef.current.add(id));
        setLoading(prev => {
            const next = new Set(prev);
            missing.forEach(id => next.add(id));
            return next;
        });

        getLayersPeriodicities(missing)
            .then(results => {
                setCache(prev => ({ ...prev, ...results }));
                setLoading(prev => {
                    const next = new Set(prev);
                    missing.forEach(id => next.delete(id));
                    return next;
                });
            })
            .catch(() => {
                setLoading(prev => {
                    const next = new Set(prev);
                    missing.forEach(id => next.delete(id));
                    return next;
                });
            });
    }, [activeLayerIds]);

    const getPeriodicity = useCallback((layerId) => cache[layerId] ?? null, [cache]);
    const isLoading = useCallback((layerId) => loading.has(layerId), [loading]);

    return { cache, getPeriodicity, isLoading };
};
