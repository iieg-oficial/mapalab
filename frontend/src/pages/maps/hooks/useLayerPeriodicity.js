import { useContext, useEffect } from 'react';
import MapsContext from '@contexts/MapsContext';

export const useLayerPeriodicity = (layerId) => {
    const { periodicityCache } = useContext(MapsContext);

    useEffect(() => {
        if (layerId) periodicityCache.ensureFetched?.(layerId);
    }, [layerId, periodicityCache]);

    if (!layerId) return { periodicity: null, loading: false, error: null };

    return {
        periodicity: periodicityCache.getPeriodicity(layerId),
        loading: periodicityCache.isLoading(layerId),
        error: null
    };
};
