import { useState, useCallback } from 'react';
import { layers } from '@pages/maps/helpers/layers/index';
import { findLayerById as findLayerByIdHelper, getAllChildLayerIds as getAllChildLayerIdsHelper } from '@pages/maps/helpers/layers/utils/layerHelpers';

export const useLayerManagement = () => {
    const [activeLayerIds, setActiveLayerIds] = useState([]);

    const findLayerById = useCallback((layerId) => {
        return findLayerByIdHelper(layerId, layers);
    }, []);

    const getAllChildLayerIds = useCallback((layerId) => {
        return getAllChildLayerIdsHelper(layerId, layers);
    }, []);

    const findParent = useCallback((layerId) => {
        const findDirectParent = (layersList, targetId) => {
            for (const layer of layersList) {
                if (layer.children && layer.children.some(child => child.id === targetId)) {
                    return layer;
                }

                if (layer.children && layer.children.length > 0) {
                    const found = findDirectParent(layer.children, targetId);
                    if (found) return found;
                }
            }
            return null;
        };

        let parent = findDirectParent(layers, layerId);
        while (parent && parent.isLabel) {
            parent = findDirectParent(layers, parent.id);
        }
        return parent;
    }, []);

    const findAllAncestors = useCallback((layerId) => {
        const ancestors = [];
        let currentId = layerId;

        while (currentId) {
            const parent = findParent(currentId);
            if (parent) {
                ancestors.push(parent);
                currentId = parent.id;
            } else {
                break;
            }
        }

        return ancestors;
    }, [findParent]);

    const getDirectChildIds = useCallback((parentId) => {
        const layer = findLayerById(parentId);
        if (layer && layer.children) {
            return layer.children
                .filter(child => !child.isLabel)
                .map(child => child.id);
        }
        return [];
    }, [findLayerById]);

    const reorderActiveLayerIds = useCallback((newOrderOrStartIndex, endIndex) => {
        if (Array.isArray(newOrderOrStartIndex)) {
            setActiveLayerIds(newOrderOrStartIndex);
        } else {
            setActiveLayerIds(prev => {
                const result = Array.from(prev);
                const [removed] = result.splice(newOrderOrStartIndex, 1);
                result.splice(endIndex, 0, removed);
                return result;
            });
        }
    }, []);

    return {
        activeLayerIds,
        setActiveLayerIds,
        findLayerById,
        getAllChildLayerIds,
        findParent,
        findAllAncestors,
        getDirectChildIds,
        reorderActiveLayerIds
    };
};
