import { useCallback } from 'react';

export const useLoadMoreFeatures = (setSelectedFeatureInfo) => {
    return useCallback(async (layerId, pageSize = 50) => {
        let added = 0;
        setSelectedFeatureInfo((info) => {
            if (!info?.results) return info;
            return {
                ...info,
                results: info.results.map((r) => {
                    if (r.layerId !== layerId) return r;
                    const cache = r.cachedFeatures || r.features;
                    const total = r.totalAvailable ?? cache.length;
                    const currentLen = r.features.length;
                    if (currentLen >= total) return r;
                    const nextCap = Math.min(currentLen + pageSize, total);
                    const nextFeatures = cache.slice(0, nextCap);
                    added = nextFeatures.length - currentLen;
                    return {
                        ...r,
                        features: nextFeatures,
                        totalFeatures: nextFeatures.length,
                        displayCap: nextCap,
                    };
                }),
            };
        });
        return added;
    }, [setSelectedFeatureInfo]);
};
