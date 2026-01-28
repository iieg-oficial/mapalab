import { useCallback, useMemo } from 'react';
import { layers } from '@pages/maps/helpers/layers/index';
import { findLayerById as findLayerByIdHelper, getAllChildLayerIds as getAllChildLayerIdsHelper } from '@pages/maps/helpers/layers/index';

export const useActiveLayersLogic = (activeLayerIds, hiddenLayerIds) => {
    const findLayerById = useCallback((id) => {
        return findLayerByIdHelper(id, layers);
    }, []);

    const getAllChildLayerIds = useCallback((layerId) => {
        return getAllChildLayerIdsHelper(layerId, layers);
    }, []);

    const findForceGroupAncestor = useCallback((layerId) => {
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
        if (!path) return null;

        for (let i = path.length - 1; i >= 0; i--) {
            if (path[i].forceGroup) {
                return path[i];
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
            if (layer.isLabel) continue;

            const forceGroupAncestor = findForceGroupAncestor(layerId);

            if (forceGroupAncestor) {
                if (!processedIds.has(forceGroupAncestor.id)) {
                    const ancestorVisible = !hiddenLayerIds.includes(forceGroupAncestor.id);
                    const childIds = getAllChildLayerIds(forceGroupAncestor.id);

                    result.push({
                        id: forceGroupAncestor.id,
                        name: forceGroupAncestor.label,
                        hasChildren: true,
                        visible: ancestorVisible,
                        order: result.length,
                        childIds
                    });

                    processedIds.add(forceGroupAncestor.id);
                    childIds.forEach(childId => processedIds.add(childId));
                }
                processedIds.add(layerId);
                continue;
            }

            const hasChildren = layer.children && layer.children.length > 0;
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
                childIds.forEach(childId => processedIds.add(childId));
            }
        }

        return result;
    }, [activeLayerIds, hiddenLayerIds, getAllChildLayerIds, findLayerById, findForceGroupAncestor]);

    return {
        findLayerById,
        getAllChildLayerIds,
        unifiedLayers
    };
};
