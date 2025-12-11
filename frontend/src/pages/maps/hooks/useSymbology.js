import { useState, useCallback, useEffect, useMemo } from 'react';
import {
    isParentLayer,
    hasWMSConfig,
    findParentLayer,
    collectActiveChildren,
    groupLayersByWMS
} from '../helpers/symbologyHelpers';

export const useSymbology = ({
    activeLayerIds,
    findLayerById,
    getAllChildLayerIds,
    allLayers
}) => {
    const [selectedLayerForSymbology, setSelectedLayerForSymbology] = useState(null);
    const [hiddenLayerIds, setHiddenLayerIds] = useState([]);

    const toggleLayerVisibility = useCallback((layerId) => {
        setHiddenLayerIds(prev => {
            const childIds = getAllChildLayerIds(layerId);
            const allIds = [layerId, ...childIds];

            if (prev.includes(layerId)) {
                return prev.filter(id => !allIds.includes(id));
            } else {
                return [...new Set([...prev, ...allIds])];
            }
        });
    }, [getAllChildLayerIds]);

    const isLayerVisible = useCallback((layerId) => {
        return !hiddenLayerIds.includes(layerId);
    }, [hiddenLayerIds]);

    const getGroupedActiveLayers = useCallback((activeLayers) => {
        const layersByParent = new Map();
        const orphans = [];

        activeLayers.forEach(layer => {
            const parent = findParentLayer(layer.id, allLayers);
            if (parent) {
                if (!layersByParent.has(parent.id)) {
                    layersByParent.set(parent.id, { parent, children: [] });
                }
                layersByParent.get(parent.id).children.push(layer);
            } else {
                orphans.push(layer);
            }
        });

        const result = [];

        layersByParent.forEach(({ parent, children }) => {
            const groupedChildren = groupLayersByWMS(parent, children);
            result.push(...groupedChildren);
        });

        result.push(...orphans);

        return result;
    }, [allLayers]);

    const getLayersForSymbology = useCallback((selectedLayer) => {
        if (!selectedLayer) {
            return [];
        }

        if (!isParentLayer(selectedLayer)) {
            return hasWMSConfig(selectedLayer) ? [selectedLayer] : [];
        }

        const activeChildren = collectActiveChildren(selectedLayer, activeLayerIds);
        return groupLayersByWMS(selectedLayer, activeChildren);
    }, [activeLayerIds]);

    const activeLayers = useMemo(() => {
        return activeLayerIds
            .map(id => findLayerById(id))
            .filter(Boolean)
            .filter(layer => hasWMSConfig(layer));
    }, [activeLayerIds, findLayerById]);

    const groupedActiveLayers = useMemo(() => {
        return getGroupedActiveLayers(activeLayers);
    }, [activeLayers, getGroupedActiveLayers]);

    useEffect(() => {
        setHiddenLayerIds(prev => {
            const allActiveIds = new Set();
            activeLayerIds.forEach(id => {
                allActiveIds.add(id);
                const childIds = getAllChildLayerIds(id);
                childIds.forEach(cid => allActiveIds.add(cid));
            });

            const newHiddenIds = prev.filter(id => allActiveIds.has(id));

            if (newHiddenIds.length !== prev.length) {
                return newHiddenIds;
            }
            return prev;
        });
    }, [activeLayerIds, getAllChildLayerIds]);

    useEffect(() => {
        if (!activeLayerIds || activeLayerIds.length === 0) {
            if (selectedLayerForSymbology) {
                setSelectedLayerForSymbology(null);
            }
            return;
        }

        const visibleParentLayers = activeLayerIds
            .map(id => findLayerById(id))
            .filter(layer => layer && isParentLayer(layer))
            .filter(layer => !hiddenLayerIds.includes(layer.id));

        const isCurrentSelectionValid = selectedLayerForSymbology && (
            activeLayerIds.includes(selectedLayerForSymbology.id) ||
            getAllChildLayerIds(selectedLayerForSymbology.id).some(id => activeLayerIds.includes(id))
        ) && !hiddenLayerIds.includes(selectedLayerForSymbology.id);

        if (!isCurrentSelectionValid) {
            if (visibleParentLayers.length > 0) {
                setSelectedLayerForSymbology(visibleParentLayers[0]);
            } else {
                setSelectedLayerForSymbology(null);
            }
        }
    }, [activeLayerIds, selectedLayerForSymbology, findLayerById, hiddenLayerIds, getAllChildLayerIds]);

    return {
        selectedLayerForSymbology,
        setSelectedLayerForSymbology,
        hiddenLayerIds,
        toggleLayerVisibility,
        isLayerVisible,
        getLayersForSymbology,
        groupedActiveLayers,
        activeLayers
    };
};
