import { useState, useCallback } from 'react';
import { useLayers } from '@hooks/useLayers';
import { findLayerById } from '@pages/maps/helpers/layers/utils/layerHelpers';

export const combineLayerFilters = (layerFilters) => {
    if (!layerFilters || Object.keys(layerFilters).length === 0) return null;
    const filterExpressions = Object.entries(layerFilters)
        .filter(([key, val]) => val && !key.startsWith('_'))
        .map(([, val]) => val);
    if (filterExpressions.length === 0) return null;
    if (filterExpressions.length === 1) return filterExpressions[0];
    return filterExpressions.map(f => `(${f})`).join(' AND ');
};

export const findFilterFromState = (filters, layerId, allLayers) => {
    if (filters[layerId]) return combineLayerFilters(filters[layerId]);

    const findParent = (node, targetId, parent = null) => {
        if (node.id === targetId) return parent;
        if (Array.isArray(node.children)) {
            for (const child of node.children) {
                const found = findParent(child, targetId, node);
                if (found) return found;
            }
        }
        return null;
    };

    const recurse = (currentLayerId) => {
        const layerNode = findLayerById(currentLayerId, allLayers);
        if (!layerNode) return null;
        for (const rootLayer of allLayers) {
            const parent = findParent(rootLayer, currentLayerId);
            if (parent) {
                if (filters[parent.id]) return combineLayerFilters(filters[parent.id]);
                return recurse(parent.id);
            }
        }
        return null;
    };

    return recurse(layerId);
};

export const useCQLFilter = () => {
    const { layers: allLayers } = useLayers();
    const [filters, setFilters] = useState({});

    const applyFilter = useCallback((layerId, filterName, cqlExpression) => {
        setFilters(prev => ({
            ...prev,
            [layerId]: {
                ...(prev[layerId] || {}),
                [filterName]: cqlExpression
            }
        }));
    }, []);

    const getFilter = useCallback((layerId) => {
        return findFilterFromState(filters, layerId, allLayers);
    }, [filters, allLayers]);

    const getSpecificFilter = useCallback((layerId, filterName) => {
        return filters[layerId]?.[filterName] || null;
    }, [filters]);

    const clearFilter = useCallback((layerId, filterName) => {
        setFilters(prev => {
            const layerFilters = { ...(prev[layerId] || {}) };
            delete layerFilters[filterName];

            if (Object.keys(layerFilters).length === 0) {
                const newFilters = { ...prev };
                delete newFilters[layerId];
                return newFilters;
            }

            const result = {
                ...prev,
                [layerId]: layerFilters
            };
            return result;
        });
    }, []);

    const clearLayerFilters = useCallback((layerId) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[layerId];
            return newFilters;
        });
    }, []);

    const clearAllFilters = useCallback(() => {
        setFilters({});
    }, []);

    const hasFilter = useCallback((layerId, filterName = null) => {
        if (filterName) {
            return Boolean(filters[layerId]?.[filterName]);
        }
        return Boolean(filters[layerId] && Object.keys(filters[layerId]).length > 0);
    }, [filters]);

    const getLayerFilters = useCallback((layerId) => {
        return filters[layerId] || {};
    }, [filters]);

    return {
        filters,
        setFilters,
        applyFilter,
        getFilter,
        getSpecificFilter,
        clearFilter,
        clearLayerFilters,
        clearAllFilters,
        hasFilter,
        getLayerFilters
    };
};
