import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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

    const showAllLayers = useCallback(() => {
        setHiddenLayerIds([]);
    }, []);

    const hideAllLayers = useCallback(() => {
        const allIds = new Set();
        activeLayerIds.forEach(id => {
            allIds.add(id);
            getAllChildLayerIds(id).forEach(cid => allIds.add(cid));
        });
        setHiddenLayerIds([...allIds]);
    }, [activeLayerIds, getAllChildLayerIds]);

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

    const isStartupRef = useRef(true);

    useEffect(() => {
        if (!activeLayerIds || activeLayerIds.length === 0) {
            setSelectedLayerForSymbology(null);
            return;
        }

        const baseLayersNode = findLayerById('base_layers');
        const baseLayerIds = new Set(baseLayersNode?.children?.map(child => child.id) || []);

        const allParentLayers = activeLayerIds
            .map(id => findLayerById(id))
            .filter(layer => layer && isParentLayer(layer))
            .filter(layer => !hiddenLayerIds.includes(layer.id));

        const allIndividualLayers = activeLayerIds
            .map(id => findLayerById(id))
            .filter(layer => layer && !isParentLayer(layer) && hasWMSConfig(layer))
            .filter(layer => !hiddenLayerIds.includes(layer.id));

        const nonBaseParentLayers = allParentLayers.filter(layer => !baseLayerIds.has(layer.id));
        const nonBaseIndividualLayers = allIndividualLayers.filter(layer => !baseLayerIds.has(layer.id));

        setSelectedLayerForSymbology(prev => {
            const isCurrentSelectionValid = prev && (
                activeLayerIds.includes(prev.id) ||
                getAllChildLayerIds(prev.id).some(id => activeLayerIds.includes(id))
            ) && !hiddenLayerIds.includes(prev.id);

            if (prev && isCurrentSelectionValid) {
                return prev;
            }

            if (isStartupRef.current) {
                isStartupRef.current = false;
                const limiteLayer = allParentLayers.find(l => l.id === 'limite_iieg') || allIndividualLayers.find(l => l.id === 'limite_iieg');
                if (limiteLayer) {
                    return limiteLayer;
                }
            }

            if (nonBaseParentLayers.length > 0) {
                return nonBaseParentLayers[0];
            } else if (nonBaseIndividualLayers.length > 0) {
                return nonBaseIndividualLayers[0];
            } else if (allParentLayers.length > 0) {
                return allParentLayers[0];
            } else if (allIndividualLayers.length > 0) {
                return allIndividualLayers[0];
            }
            return null;
        });
    }, [activeLayerIds, findLayerById, hiddenLayerIds, getAllChildLayerIds]);

    return {
        selectedLayerForSymbology,
        setSelectedLayerForSymbology,
        hiddenLayerIds,
        setHiddenLayerIds,
        toggleLayerVisibility,
        isLayerVisible,
        showAllLayers,
        hideAllLayers,
        getLayersForSymbology,
        groupedActiveLayers,
        activeLayers
    };
};
