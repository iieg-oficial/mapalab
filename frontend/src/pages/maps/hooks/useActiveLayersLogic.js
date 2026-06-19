import { useCallback, useContext, useMemo } from 'react';
import { useLayers } from '@hooks/useLayers';
import EventoContext from '@contexts/EventoContext';
import { findLayerById as findLayerByIdHelper, getAllChildLayerIds as getAllChildLayerIdsHelper } from '@pages/maps/helpers/layers/utils/layerHelpers';

export const useActiveLayersLogic = (activeLayerIds, hiddenLayerIds) => {
    const { layers } = useLayers();
    const eventoCtx = useContext(EventoContext);
    const getAliasByLayerId = eventoCtx?.getAliasByLayerId;

    const findLayerById = useCallback((id) => {
        return findLayerByIdHelper(id, layers);
    }, [layers]);

    const getAllChildLayerIds = useCallback((layerId) => {
        return getAllChildLayerIdsHelper(layerId, layers);
    }, [layers]);

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
    }, [layers]);

    const unifiedLayers = useMemo(() => {
        const processedIds = new Set();
        const result = [];

        for (const layerId of activeLayerIds) {
            if (processedIds.has(layerId)) continue;

            const layer = findLayerById(layerId);
            if (!layer) continue;
            if (layer.isLabel) continue;
            if (layer.isCategory) continue;

            const forceGroupAncestor = findForceGroupAncestor(layerId);

            if (forceGroupAncestor) {
                if (!processedIds.has(forceGroupAncestor.id)) {
                    const childIds = getAllChildLayerIds(forceGroupAncestor.id);
                    const activeChildIds = childIds.filter(id => activeLayerIds.includes(id));
                    const ancestorVisible = !hiddenLayerIds.includes(forceGroupAncestor.id)
                        && (activeChildIds.length === 0 || !activeChildIds.every(id => hiddenLayerIds.includes(id)));

                    const ancestorAlias = getAliasByLayerId?.(forceGroupAncestor.id);
                    result.push({
                        id: forceGroupAncestor.id,
                        name: ancestorAlias || forceGroupAncestor.label,
                        hasChildren: true,
                        visible: ancestorVisible,
                        order: result.length,
                        childIds,
                        badge: forceGroupAncestor.badge
                    });

                    processedIds.add(forceGroupAncestor.id);
                    childIds.forEach(childId => processedIds.add(childId));
                }
                processedIds.add(layerId);
                continue;
            }

            const hasChildren = layer.children && layer.children.length > 0;
            const childIds = hasChildren ? getAllChildLayerIds(layer.id) : [layer.id];
            const activeChildIds = hasChildren ? childIds.filter(id => activeLayerIds.includes(id)) : childIds;
            const visible = !hiddenLayerIds.includes(layerId)
                && (!hasChildren || activeChildIds.length === 0 || !activeChildIds.every(id => hiddenLayerIds.includes(id)));

            const alias = getAliasByLayerId?.(layer.id);
            result.push({
                id: layer.id,
                name: alias || layer.label,
                hasChildren,
                visible,
                order: result.length,
                childIds,
                badge: layer.badge
            });

            processedIds.add(layerId);

            if (hasChildren) {
                childIds.forEach(childId => processedIds.add(childId));
            }
        }

        return result;
    }, [activeLayerIds, hiddenLayerIds, getAllChildLayerIds, findLayerById, findForceGroupAncestor, getAliasByLayerId]);

    return {
        findLayerById,
        getAllChildLayerIds,
        unifiedLayers
    };
};
