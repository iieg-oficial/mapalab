import { useState, useCallback, useContext, useRef } from 'react';
import MapsContext from '@contexts/MapsContext';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { getFeatureInfoForActiveLayers, getFeaturesInPolygonForActiveLayers, FEATURE_COUNT_CAP, FEATURE_COUNT_TOTAL } from '@services/featureInfoService';
import { useLoadMoreFeatures } from './useLoadMoreFeatures';
import { useLoadMorePolygonFeatures } from './useLoadMorePolygonFeatures';
import { toLonLat } from 'ol/proj';
import { useLayers } from '@hooks/useLayers';
import { useEventoContext } from '@hooks/useEvento';
import { findLayerById, collectLayersWithWMS, findParentGroup, resolveLayerDisplayName, groupAlternativeResults } from '../helpers/layers/utils/layerHelpers';

const FEATURE_INFO_LOADING_ID = 'feature_info_query';

const INEGI_LAYER_IDS = ['limite_inegi', 'limite_municipal_inegi'];

export const useFeatureInfo = (overrides = null) => {
    const ctx = useContext(MapsContext);
    const { selectedFeatureInfo, setSelectedFeatureInfo, clickPosition, selectedLayerForSymbology, setSelectedLayerForSymbology } = ctx;
    const activeLayerIds = overrides?.activeLayerIds ?? ctx.activeLayerIds;
    const hiddenLayerIds = overrides?.hiddenLayerIds ?? ctx.hiddenLayerIds;
    const getFilter = overrides?.getFilter ?? ctx.getFilter;
    const { layers: allLayers } = useLayers();
    const { getAliasByLayerId } = useEventoContext();
    const { setLayerLoading } = useLayerLoading();
    const [loading, setLoading] = useState(false);
    const polygonPageRef = useRef(null);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        let queriedLayerId = null;

        if (!activeLayerIds || activeLayerIds.length === 0) {
            return null;
        }

        if (selectedLayerForSymbology) {
            if (hiddenLayerIds.includes(selectedLayerForSymbology.id)) {
                return null;
            }

            const layerNode = findLayerById(selectedLayerForSymbology.id, allLayers);
            const fallback = selectedLayerForSymbology.name || selectedLayerForSymbology.label || layerNode?.label;
            const ancestor = findParentGroup(selectedLayerForSymbology.id, allLayers);
            queriedLayerName = resolveLayerDisplayName(selectedLayerForSymbology.id, fallback, ancestor, getAliasByLayerId);
            queriedLayerId = selectedLayerForSymbology.id;

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
            const isInegiMode = activeLayerIds.some(id => INEGI_LAYER_IDS.includes(id));
            const results = await getFeatureInfoForActiveLayers(activeLayers, map, coordinate, getFilter, isInegiMode, allLayers, FEATURE_COUNT_CAP);
            // Solo lanzamos el segundo fetch (cap 2000) si alguna capa llego al cap.
            // Si todas devuelven < 50, ya tenemos todo y nos ahorramos la request.
            const needsTotal = (results || []).some(r => (r.features?.length || 0) >= FEATURE_COUNT_CAP);
            const totalResults = needsTotal
                ? await getFeatureInfoForActiveLayers(activeLayers, map, coordinate, getFilter, isInegiMode, allLayers, FEATURE_COUNT_TOTAL)
                : results;
            const [lng, lat] = toLonLat(coordinate);

            if (results && results.length > 0) {
                const totalsByLayerId = {};
                (totalResults || []).forEach((tr) => {
                    totalsByLayerId[tr.layerId] = tr.features || [];
                });
                const enriched = results.map((r) => {
                    const fullFeatures = totalsByLayerId[r.layerId] || r.features;
                    const totalAvailable = fullFeatures.length;
                    const visible = Math.min(r.features?.length || 0, totalAvailable);
                    const cappedAtLimit = totalAvailable >= FEATURE_COUNT_TOTAL;
                    return {
                        ...r,
                        features: fullFeatures.slice(0, visible),
                        cachedFeatures: fullFeatures,
                        totalAvailable,
                        cappedAtLimit,
                        displayCap: visible,
                    };
                });
                setSelectedFeatureInfo({
                    lngLat: { lng, lat },
                    results: enriched,
                    queriedLayerName,
                    queriedLayerId
                });
                return enriched;
            } else {
                const otherActiveLayers = getAllActiveLayers().filter(l =>
                    !layersToQuery.some(q => q.id === l.id)
                );

                let alternativeLayers = [];
                let altResultsCache = null;

                if (otherActiveLayers.length > 0) {
                    const altResults = await getFeatureInfoForActiveLayers(otherActiveLayers, map, coordinate, getFilter, isInegiMode, allLayers);
                    if (altResults && altResults.length > 0) {
                        altResultsCache = altResults;
                        alternativeLayers = groupAlternativeResults(altResults, allLayers, getAliasByLayerId);
                    }
                }

                setSelectedFeatureInfo({
                    lngLat: { lng, lat },
                    results: [],
                    queriedLayerName,
                    queriedLayerId,
                    alternativeLayers,
                    alternativeResults: altResultsCache
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hiddenLayerIds, activeLayerIds, setSelectedFeatureInfo, clickPosition, getFilter, selectedLayerForSymbology, setLayerLoading, getAllActiveLayers, getAliasByLayerId]);

    const selectAlternativeLayer = useCallback((layer) => {
        const layerNode = findLayerById(layer.id, allLayers);
        if (layerNode) {
            setSelectedLayerForSymbology({
                id: layerNode.id,
                name: layer.name || layerNode.label
            });
        }

        setSelectedFeatureInfo(current => {
            if (!current?.alternativeResults) return current;

            let matchingResults;
            if (layer.isGroup && layerNode) {
                const descendantIds = new Set(collectLayersWithWMS(layerNode).map(n => n.id));
                matchingResults = current.alternativeResults.filter(r => descendantIds.has(r.layerId));
            } else {
                matchingResults = current.alternativeResults.filter(r => r.layerId === layer.id);
            }

            if (matchingResults.length === 0) return current;

            return {
                ...current,
                results: matchingResults,
                queriedLayerName: layer.name,
                queriedLayerId: layer.id,
                alternativeLayers: null,
                alternativeResults: current.alternativeResults
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setSelectedLayerForSymbology, setSelectedFeatureInfo]);

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
            const isInegiMode = activeLayerIds.some(id => INEGI_LAYER_IDS.includes(id));
            const page = await getFeaturesInPolygonForActiveLayers(activeLayers, map, polygonGeometry, getFilter, isInegiMode, allLayers);
            const { results, matched, nextIndex, hasMore } = page;
            polygonPageRef.current = { activeLayers, map, polygonGeometry, isInegiMode, allLayers, nextIndex, hasMore, matched };
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
                        isPolygonSelection: true,
                        matched,
                        hasMore
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hiddenLayerIds, activeLayerIds, setSelectedFeatureInfo, clickPosition, getFilter, setLayerLoading]);

    const clearFeatureInfo = useCallback(() => {
        setSelectedFeatureInfo(null);
        clickPosition.clearPosition();
    }, [setSelectedFeatureInfo, clickPosition]);

    const loadMoreFeatures = useLoadMoreFeatures(selectedFeatureInfo, setSelectedFeatureInfo);
    const loadMorePolygonFeatures = useLoadMorePolygonFeatures(polygonPageRef, getFilter, setSelectedFeatureInfo);

    return {
        queryFeatures,
        queryFeaturesInPolygon,
        clearFeatureInfo,
        selectAlternativeLayer,
        loadMoreFeatures,
        loadMorePolygonFeatures,
        loading
    };
};
