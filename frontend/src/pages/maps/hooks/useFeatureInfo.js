import { useState, useCallback, useContext } from 'react';
import MapsContext from '@contexts/MapsContext';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { getFeatureInfoForActiveLayers, getFeaturesInPolygonForActiveLayers } from '@services/featureInfoService';
import { toLonLat } from 'ol/proj';
import { findLayerById, layers as allLayers, collectLayersWithWMS, findParentGroup } from '../helpers/layers/index';

const FEATURE_INFO_LOADING_ID = 'feature_info_query';

export const useFeatureInfo = () => {
    const { hiddenLayerIds, setSelectedFeatureInfo, clickPosition, activeLayerIds, getFilter, selectedLayerForSymbology, setSelectedLayerForSymbology } = useContext(MapsContext);
    const { setLayerLoading } = useLayerLoading();
    const [loading, setLoading] = useState(false);

    const getAllActiveLayers = useCallback(() => {
        const hiddenIdSet = new Set(hiddenLayerIds || []);
        const activeIdSet = new Set(activeLayerIds || []);

        return (activeLayerIds || []).flatMap(layerId => {
            if (hiddenIdSet.has(layerId)) return [];

            const layerNode = findLayerById(layerId, allLayers);
            if (!layerNode) return [];

            const wmsLayers = collectLayersWithWMS(layerNode).filter(node => activeIdSet.has(node.id));

            if (wmsLayers.length > 0) {
                return wmsLayers.map(node => ({
                    id: node.id,
                    name: node.label,
                    visible: true
                }));
            } else if (layerNode.wmsConfig) {
                return [{
                    id: layerNode.id,
                    name: layerNode.label,
                    visible: true
                }];
            }
            return [];
        });
    }, [activeLayerIds, hiddenLayerIds]);

    const queryFeatures = useCallback(async (map, coordinate, event) => {
        if (!map || !coordinate) {
            return null;
        }

        if (event) {
            clickPosition.updatePosition(event);
        }

        let layersToQuery = [];
        let queriedLayerName = null;

        if (!activeLayerIds || activeLayerIds.length === 0) {
            return null;
        }

        if (selectedLayerForSymbology) {
            if (hiddenLayerIds.includes(selectedLayerForSymbology.id)) {
                return null;
            }

            queriedLayerName = selectedLayerForSymbology.name;

            const layerNode = findLayerById(selectedLayerForSymbology.id, allLayers);
            if (layerNode) {
                const activeIdSet = new Set(activeLayerIds || []);
                const wmsLayers = collectLayersWithWMS(layerNode).filter(node => activeIdSet.has(node.id));

                if (wmsLayers.length > 0) {
                    layersToQuery = wmsLayers.map(node => ({
                        id: node.id,
                        name: node.label,
                        visible: true
                    }));
                } else if (layerNode.wmsConfig && activeIdSet.has(layerNode.id)) {
                    layersToQuery = [{
                        id: layerNode.id,
                        name: layerNode.label,
                        visible: true
                    }];
                }
            }
        }
        const activeLayers = layersToQuery;

        setLoading(true);
        setLayerLoading(FEATURE_INFO_LOADING_ID, true);

        try {
            const results = await getFeatureInfoForActiveLayers(activeLayers, map, coordinate, getFilter);
            const [lng, lat] = toLonLat(coordinate);

            if (results && results.length > 0) {
                setSelectedFeatureInfo({
                    lngLat: { lng, lat },
                    results,
                    queriedLayerName
                });
                return results;
            } else {
                const otherActiveLayers = getAllActiveLayers().filter(l =>
                    !layersToQuery.some(q => q.id === l.id)
                );

                let alternativeLayers = [];

                if (otherActiveLayers.length > 0) {
                    const altResults = await getFeatureInfoForActiveLayers(otherActiveLayers, map, coordinate, getFilter);
                    if (altResults && altResults.length > 0) {
                        const groupedAlternatives = new Map();

                        altResults.forEach(r => {
                            const parentGroup = findParentGroup(r.layerId, allLayers);
                            const groupKey = parentGroup ? parentGroup.id : r.layerId;
                            const groupName = parentGroup ? parentGroup.label : r.layerName;

                            if (groupedAlternatives.has(groupKey)) {
                                const existing = groupedAlternatives.get(groupKey);
                                existing.count += r.features?.length || 0;
                            } else {
                                groupedAlternatives.set(groupKey, {
                                    id: groupKey,
                                    name: groupName,
                                    count: r.features?.length || 0,
                                    isGroup: !!parentGroup
                                });
                            }
                        });

                        alternativeLayers = Array.from(groupedAlternatives.values());
                    }
                }

                setSelectedFeatureInfo({
                    lngLat: { lng, lat },
                    results: [],
                    queriedLayerName,
                    alternativeLayers
                });

                return null;
            }
        } catch {
            setSelectedFeatureInfo(null);
            clickPosition.clearPosition();
            return null;
        } finally {
            setLoading(false);
            setLayerLoading(FEATURE_INFO_LOADING_ID, false);
        }
    }, [hiddenLayerIds, activeLayerIds, setSelectedFeatureInfo, clickPosition, getFilter, selectedLayerForSymbology, setLayerLoading, getAllActiveLayers]);

    const selectAlternativeLayer = useCallback((layer) => {
        const layerNode = findLayerById(layer.id, allLayers);
        if (layerNode) {
            setSelectedLayerForSymbology({
                id: layerNode.id,
                name: layerNode.label || layer.name
            });
        }
    }, [setSelectedLayerForSymbology]);

    const queryFeaturesInPolygon = useCallback(async (map, polygonGeometry, centerCoordinate, onFeatureCountUpdate) => {
        if (!map || !polygonGeometry) {
            return null;
        }

        const hiddenIdSet = new Set(hiddenLayerIds || []);

        const baseLayersNode = findLayerById('base_layers', allLayers);
        const baseLayerIds = new Set(
            baseLayersNode?.children?.map(child => child.id) || []
        );

        const nonBaseActiveLayerIds = (activeLayerIds || []).filter(id => !baseLayerIds.has(id));
        const hasNonBaseLayers = nonBaseActiveLayerIds.length > 0;

        let layerIdsToQuery = activeLayerIds || [];

        if (!hasNonBaseLayers && baseLayersNode) {
            const visibleBaseLayers = baseLayersNode.children
                .filter(child => !hiddenIdSet.has(child.id))
                .map(child => child.id);
            layerIdsToQuery = visibleBaseLayers;
        }

        const expandedLayers = layerIdsToQuery.flatMap(layerId => {
            if (hiddenIdSet.has(layerId)) return [];

            const layerNode = findLayerById(layerId, allLayers);
            if (!layerNode) return [];

            const wmsLayers = collectLayersWithWMS(layerNode).filter(node =>
                layerIdsToQuery.includes(node.id) || baseLayerIds.has(node.id)
            );

            if (wmsLayers.length === 0 && layerNode.wmsConfig) {
                return [{
                    id: layerNode.id,
                    name: layerNode.label,
                    visible: true
                }];
            }

            return wmsLayers.map(node => ({
                id: node.id,
                name: node.label,
                visible: true
            }));
        });

        const activeLayersMap = new Map();
        expandedLayers.forEach(layerInfo => {
            if (!activeLayersMap.has(layerInfo.id)) {
                activeLayersMap.set(layerInfo.id, layerInfo);
            }
        });

        const activeLayers = Array.from(activeLayersMap.values());

        setLoading(true);
        setLayerLoading(FEATURE_INFO_LOADING_ID, true);
        try {
            const results = await getFeaturesInPolygonForActiveLayers(activeLayers, map, polygonGeometry, getFilter);
            const [lng, lat] = toLonLat(centerCoordinate);

            if (results && results.length > 0) {
                const totalFeatures = results.reduce((sum, result) => sum + (result.features?.length || 0), 0);
                const layerBreakdown = results
                    .filter(result => result.features?.length > 0)
                    .map(result => ({
                        name: result.layerName,
                        count: result.features.length
                    }));

                if (onFeatureCountUpdate) {
                    onFeatureCountUpdate(totalFeatures, layerBreakdown, results);
                }

                setTimeout(() => {
                    const pixel = map.getPixelFromCoordinate(centerCoordinate);
                    clickPosition.updatePosition({ pixel });

                    setSelectedFeatureInfo({
                        lngLat: { lng, lat },
                        results,
                        isPolygonSelection: true
                    });
                }, 100);
                return results;
            } else {
                if (onFeatureCountUpdate) {
                    onFeatureCountUpdate(0);
                }

                setSelectedFeatureInfo(null);
                clickPosition.clearPosition();
                return null;
            }
        } catch {
            setSelectedFeatureInfo(null);
            clickPosition.clearPosition();
            return null;
        } finally {
            setLoading(false);
            setLayerLoading(FEATURE_INFO_LOADING_ID, false);
        }
    }, [hiddenLayerIds, activeLayerIds, setSelectedFeatureInfo, clickPosition, getFilter, setLayerLoading]);

    const clearFeatureInfo = useCallback(() => {
        setSelectedFeatureInfo(null);
        clickPosition.clearPosition();
    }, [setSelectedFeatureInfo, clickPosition]);

    return {
        queryFeatures,
        queryFeaturesInPolygon,
        clearFeatureInfo,
        selectAlternativeLayer,
        loading
    };
};
