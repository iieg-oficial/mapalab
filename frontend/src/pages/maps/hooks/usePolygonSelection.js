import { useCallback, useRef } from 'react';
import { getFeaturesInPolygonForActiveLayers } from '@services/featureInfoService';

export const usePolygonSelection = ({ getFilter = null, pageRef = null } = {}) => {
    const localPageRef = useRef(null);
    const polygonPageRef = pageRef || localPageRef;

    const queryPolygon = useCallback(async ({ map, polygonGeometry, activeLayers, allLayers = [], isInegiMode = false }) => {
        if (!map || !polygonGeometry || !activeLayers || activeLayers.length === 0) {
            polygonPageRef.current = null;
            return null;
        }

        const page = await getFeaturesInPolygonForActiveLayers(
            activeLayers, map, polygonGeometry, getFilter, isInegiMode, allLayers
        );

        polygonPageRef.current = {
            activeLayers,
            map,
            polygonGeometry,
            isInegiMode,
            allLayers,
            nextIndex: page.nextIndex,
            hasMore: page.hasMore,
            matched: page.matched
        };

        return page;
    }, [getFilter, polygonPageRef]);

    const loadMorePage = useCallback(async () => {
        const state = polygonPageRef.current;
        if (!state || !state.hasMore || state.busy) return null;

        state.busy = true;
        try {
            const page = await getFeaturesInPolygonForActiveLayers(
                state.activeLayers, state.map, state.polygonGeometry, getFilter,
                state.isInegiMode, state.allLayers,
                { startIndex: state.nextIndex }
            );

            state.nextIndex = page.nextIndex;
            state.hasMore = page.hasMore;
            return page;
        } catch {
            state.hasMore = false;
            return null;
        } finally {
            state.busy = false;
        }
    }, [getFilter, polygonPageRef]);

    const clearPolygonPage = useCallback(() => {
        polygonPageRef.current = null;
    }, [polygonPageRef]);

    return { polygonPageRef, queryPolygon, loadMorePage, clearPolygonPage };
};
