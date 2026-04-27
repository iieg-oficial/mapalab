import { useCallback } from 'react';

export const useLoadMoreFeatures = (selectedFeatureInfo, setSelectedFeatureInfo) => {
    return useCallback(async (layerId, pageSize = 50) => {
        const result = selectedFeatureInfo?.results?.find((r) => r.layerId === layerId);
        if (!result) return 0;

        const cache = result.cachedFeatures || result.features;
        const total = result.totalAvailable ?? cache.length;
        const currentLen = result.features.length;
        if (currentLen >= total) return 0;

        const nextCap = Math.min(currentLen + pageSize, total);
        const nextFeatures = cache.slice(0, nextCap);
        const added = nextFeatures.length - currentLen;
        if (added <= 0) return 0;

        setSelectedFeatureInfo((info) => {
            if (!info?.results) return info;
            return {
                ...info,
                results: info.results.map((r) => {
                    if (r.layerId !== layerId) return r;
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
    }, [selectedFeatureInfo, setSelectedFeatureInfo]);
};
