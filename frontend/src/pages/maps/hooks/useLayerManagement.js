import { useState, useCallback } from 'react';
import { layers } from '@pages/maps/helpers/layers/index';

export const useLayerManagement = () => {
    const [activeLayerIds, setActiveLayerIds] = useState([]);

    const findLayerById = useCallback((layerId) => {
        const find = (layers) => {
            for (const layer of layers) {
                if (layer.id === layerId) return layer;
                if (layer.children && layer.children.length > 0) {
                    const found = find(layer.children);
                    if (found) return found;
                }
            }
            return null;
        };

        return find(layers);
    }, []);

    const getAllChildLayerIds = useCallback((layerId) => {
        const findLayer = (layers, id, result = []) => {
            for (const layer of layers) {
                if (layer.id === id) {
                    if (layer.children && layer.children.length > 0) {
                        collectChildIds(layer.children, result);
                    }
                    return true;
                }

                if (layer.children && layer.children.length > 0) {
                    if (findLayer(layer.children, id, result)) {
                        return true;
                    }
                }
            }
            return false;
        };

        const collectChildIds = (layers, result) => {
            for (const layer of layers) {
                result.push(layer.id);
                if (layer.children && layer.children.length > 0) {
                    collectChildIds(layer.children, result);
                }
            }
        };

        const childIds = [];
        findLayer(layers, layerId, childIds);
        return childIds;
    }, []);

    const findParent = useCallback((layerId) => {
        const findDirectParent = (layers, targetId) => {
            for (const layer of layers) {
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