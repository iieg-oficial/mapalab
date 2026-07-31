import { useCallback } from 'react';
import { usePolygonSelection } from './usePolygonSelection';

export const mergePolygonPage = (info, page) => {
    if (!info?.results) return info;

    const byLayer = new Map(info.results.map(r => [r.layerId, r]));

    page.results.forEach((incoming) => {
        const current = byLayer.get(incoming.layerId);
        if (current) {
            const merged = [...current.features, ...incoming.features];
            byLayer.set(incoming.layerId, { ...current, features: merged, totalFeatures: merged.length });
        } else {
            byLayer.set(incoming.layerId, incoming);
        }
    });

    return { ...info, results: Array.from(byLayer.values()), hasMore: page.hasMore };
};

export const useLoadMorePolygonFeatures = (pageRef, getFilter, setSelectedFeatureInfo) => {
    const { loadMorePage } = usePolygonSelection({ getFilter, pageRef });

    return useCallback(async () => {
        const page = await loadMorePage();

        if (!page || !page.results.length) {
            setSelectedFeatureInfo((info) => (info?.results ? { ...info, hasMore: false } : info));
            return 0;
        }

        setSelectedFeatureInfo((info) => mergePolygonPage(info, page));
        return page.results.reduce((total, result) => total + result.features.length, 0);
    }, [loadMorePage, setSelectedFeatureInfo]);
};
