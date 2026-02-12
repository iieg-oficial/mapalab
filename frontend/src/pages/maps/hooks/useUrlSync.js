import { useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useDebounce } from '@hooks/useDebounce';
import { useMapsContext } from '@hooks/useMaps';
import { filtersInitializationComplete } from './useInitializeFromUrl';

export const useUrlSync = () => {
    const { activeLayerIds, filters, findLayerById } = useMapsContext();
    const [_searchParams, setSearchParams] = useSearchParams();
    const isFirstRender = useRef(true);
    const previousState = useRef({ layerIds: [], filters: {} });

    const debouncedActiveLayerIds = useDebounce(activeLayerIds, 500);
    const debouncedFilters = useDebounce(filters, 500);

    const expectedParams = useMemo(() => {
        const result = {};

        const validLayerIds = debouncedActiveLayerIds.filter(id => {
            if (!id || id.trim().length === 0) return false;
            const layer = findLayerById(id);
            return layer && !layer.isLabel && !layer.isCategory;
        });
        if (validLayerIds.length > 0) {
            result.layers = validLayerIds.join(',');
        }

        Object.entries(debouncedFilters).forEach(([layerId, layerFilters]) => {
            if (layerFilters && Object.keys(layerFilters).length > 0) {
                const filterExpressions = Object.entries(layerFilters)
                    .filter(([key, val]) => val && !key.startsWith('_'))
                    .map(([, val]) => val);

                if (filterExpressions.length > 0) {
                    const combinedFilter = filterExpressions.length === 1
                        ? filterExpressions[0]
                        : filterExpressions.map(f => `(${f})`).join(' AND ');
                    result[`filter_${layerId}`] = combinedFilter;
                }
            }
        });

        return result;
    }, [debouncedActiveLayerIds, debouncedFilters, findLayerById]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            previousState.current = {
                layerIds: debouncedActiveLayerIds,
                filters: debouncedFilters
            };
            return;
        }

        if (!filtersInitializationComplete.value) {
            return;
        }

        const layersChanged =
            [...debouncedActiveLayerIds].sort().join(',') !==
            [...previousState.current.layerIds].sort().join(',');

        const filtersChanged =
            JSON.stringify(debouncedFilters) !==
            JSON.stringify(previousState.current.filters);

        if (!layersChanged && !filtersChanged) {
            return;
        }

        previousState.current = {
            layerIds: debouncedActiveLayerIds,
            filters: debouncedFilters
        };

        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);

            const keysToDelete = Array.from(newParams.keys()).filter(key =>
                key === 'layers' || key.startsWith('filter_') || key.startsWith('swap_')
            );
            keysToDelete.forEach(key => newParams.delete(key));

            Object.entries(expectedParams).forEach(([key, value]) => {
                newParams.set(key, value);
            });

            return newParams;
        }, { replace: true });
    }, [expectedParams, debouncedActiveLayerIds, debouncedFilters, setSearchParams]);
};
