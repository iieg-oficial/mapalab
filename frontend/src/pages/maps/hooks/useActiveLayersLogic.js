import { useCallback, useMemo } from 'react';
import { layers } from '@pages/maps/helpers/layers/index';

export const useActiveLayersLogic = (activeLayerIds, hiddenLayerIds) => {
    const findLayerById = useCallback((id) => {
        const search = (layersList) => {
            for (const layer of layersList) {
                if (layer.id === id) return layer;
                if (layer.children && layer.children.length > 0) {
                    const found = search(layer.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return search(layers);
    }, []);

    const getAllChildLayerIds = useCallback((layerId) => {
        const result = [];

        const collectIds = (layers) => {
            for (const layer of layers) {
                result.push(layer.id);
                if (layer.children && layer.children.length > 0) {
                    collectIds(layer.children);
                }
            }
        };

        const layer = findLayerById(layerId);
        if (layer && layer.children && layer.children.length > 0) {
            collectIds(layer.children);
        }

        return result;
    }, [findLayerById]);

    const findRootChildAncestor = useCallback((layerId) => {
        const findPath = (currentLayers, targetId, path = []) => {
            for (const layer of currentLayers) {
                const currentPath = [...path, layer];
                if (layer.id === targetId) {
                    return currentPath;
                }
                if (layer.children && layer.children.length > 0) {
                    const foundPath = findPath(layer.children, targetId, currentPath);
                    if (foundPath) return foundPath;
                }
            }
            return null;
        };

        const path = findPath(layers, layerId);

        if (path && path.length > 0) {
            if (path.length === 2) {
                return path[0];
            }
            if (path.length > 2) {
                return path[1];
            }
        }

        return null;
    }, []);

    const unifiedLayers = useMemo(() => {
        const processedIds = new Set();
        const result = [];

        for (const layerId of activeLayerIds) {
            if (processedIds.has(layerId)) continue;

            const layer = findLayerById(layerId);
            if (!layer) continue;

            const hasChildren = layer.children && layer.children.length > 0;
            const isProperty = !hasChildren;

            if (isProperty) {
                const ancestor = findRootChildAncestor(layerId);

                if (ancestor) {
                    if (!processedIds.has(ancestor.id)) {
                        const ancestorVisible = !hiddenLayerIds.includes(ancestor.id);

                        result.push({
                            id: ancestor.id,
                            name: ancestor.label,
                            hasChildren: true,
                            visible: ancestorVisible,
                            order: result.length,
                            childIds: getAllChildLayerIds(ancestor.id)
                        });

                        processedIds.add(ancestor.id);

                        if (ancestor.children) {
                            const childIds = getAllChildLayerIds(ancestor.id);
                            childIds.forEach(childId => processedIds.add(childId));
                        }
                    }
                    processedIds.add(layerId);
                    continue;
                }
            }

            const visible = !hiddenLayerIds.includes(layerId);
            const childIds = hasChildren ? getAllChildLayerIds(layer.id) : [layer.id];

            result.push({
                id: layer.id,
                name: layer.label,
                hasChildren,
                visible,
                order: result.length,
                childIds
            });

            processedIds.add(layerId);

            if (hasChildren) {
                const childIds = getAllChildLayerIds(layerId);
                childIds.forEach(childId => processedIds.add(childId));
            }
        }

        return result;
    }, [activeLayerIds, hiddenLayerIds, getAllChildLayerIds, findLayerById, findRootChildAncestor]);

    return {
        findLayerById,
        getAllChildLayerIds,
        unifiedLayers
    };
};