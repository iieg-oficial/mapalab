import { useState, useCallback } from 'react';
import { findLayerById, layers as allLayers } from '@pages/maps/helpers/layers';

export const useCQLFilter = () => {
    const [filters, setFilters] = useState({});

    const combineFilters = useCallback((layerFilters) => {
        if (!layerFilters || Object.keys(layerFilters).length === 0) {
            return null;
        }

        const filterExpressions = Object.entries(layerFilters)
            .filter(([key, val]) => val && !key.startsWith('_'))
            .map(([, val]) => val);

        if (filterExpressions.length === 0) {
            return null;
        }

        if (filterExpressions.length === 1) {
            return filterExpressions[0];
        }

        return filterExpressions.map(f => `(${f})`).join(' AND ');
    }, []);

    const applyFilter = useCallback((layerId, filterName, cqlExpression) => {
        setFilters(prev => ({
            ...prev,
            [layerId]: {
                ...(prev[layerId] || {}),
                [filterName]: cqlExpression
            }
        }));
    }, []);

    const findFilterInHierarchy = useCallback((layerId) => {
        if (filters[layerId]) {
            return combineFilters(filters[layerId]);
        }

        const findParentFilter = (currentLayerId) => {
            const layerNode = findLayerById(currentLayerId, allLayers);
            if (!layerNode) return null;

            const findParent = (node, targetId, parent = null) => {
                if (node.id === targetId) {
                    return parent;
                }

                if (Array.isArray(node.children)) {
                    for (const child of node.children) {
                        const found = findParent(child, targetId, node);
                        if (found) return found;
                    }
                }

                return null;
            };

            for (const rootLayer of allLayers) {
                const parent = findParent(rootLayer, currentLayerId);
                if (parent) {
                    if (filters[parent.id]) {
                        return combineFilters(filters[parent.id]);
                    }
                    return findParentFilter(parent.id);
                }
            }

            return null;
        };

        return findParentFilter(layerId);
    }, [filters, combineFilters]);

    const getFilter = useCallback((layerId) => {
        return findFilterInHierarchy(layerId);
    }, [findFilterInHierarchy]);

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
