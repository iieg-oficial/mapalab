import { useCallback } from 'react';
import { getFeaturesInPolygonForActiveLayers } from '@services/featureInfoService';

export const useLoadMorePolygonFeatures = (pageRef, getFilter, setSelectedFeatureInfo) => {
    return useCallback(async () => {
        const state = pageRef.current;
        if (!state || !state.hasMore || state.busy) return 0;

        state.busy = true;
        try {
            const page = await getFeaturesInPolygonForActiveLayers(
                state.activeLayers, state.map, state.polygonGeometry, getFilter,
                state.isInegiMode, state.allLayers,
                { startIndex: state.nextIndex }
            );

            state.nextIndex = page.nextIndex;
            state.hasMore = page.hasMore;
            if (!page.results.length) return 0;

            let added = 0;
            setSelectedFeatureInfo((info) => {
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
                    added += incoming.features.length;
                });
                return { ...info, results: Array.from(byLayer.values()), hasMore: page.hasMore };
            });
            return added;
        } catch {
            return 0;
        } finally {
            state.busy = false;
        }
    }, [pageRef, getFilter, setSelectedFeatureInfo]);
};
