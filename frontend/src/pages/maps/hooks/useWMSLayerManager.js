import { useEffect, useCallback, useRef, useMemo } from 'react';
import { hasWMSConfig, findWMSConfig, resolveTimeStyle } from '../helpers/wmsConfig';
import { useLayers } from '@hooks/useLayers';
import { findLayerById } from '../helpers/layers/utils/layerHelpers';
import { buildLayerCqlSegment, isSingleTimeLayer } from '../helpers/layerCqlSegment';
import { filtersInitializationComplete } from './useInitializeFromUrl';
import { useDebounce } from '@hooks/useDebounce';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { computeLayerZIndex } from '../helpers/layerZIndex';

const INEGI_LAYER_IDS = ['limite_inegi', 'limite_municipal_inegi'];
const EMPTY_PINNED = new Set();
const EMPTY_ORDER = [];
const EMPTY_VECTOR_IDS = new Set();
const EMPTY_MUNICIPIO_CTX = { active: false, claves: [], nombres: [], bbox: null };

export const useWMSLayerManager = ({ mapRef, activeLayerIds, hiddenLayerIds, createWMSLayer, getLayerOpacity, layerOpacities, getFilter, combineCQLFilters, pinnedLayerIds = EMPTY_PINNED, initialOrder = EMPTY_ORDER, municipioContext = EMPTY_MUNICIPIO_CTX, vectorLayerIds = EMPTY_VECTOR_IDS }) => {
    const { layers } = useLayers();
    const wmsLayersRef = useRef(new Map());
    const isFirstRender = useRef(true);
    const debouncedActiveLayerIds = useDebounce(activeLayerIds, 30);
    const debouncedHiddenLayerIds = useDebounce(hiddenLayerIds, 30);
    const { setLayerLoading } = useLayerLoading();
    const getFilterRef = useRef(getFilter);
    getFilterRef.current = getFilter;
    const combineCQLFiltersRef = useRef(combineCQLFilters);
    combineCQLFiltersRef.current = combineCQLFilters;
    const pinnedLayerIdsRef = useRef(pinnedLayerIds);
    pinnedLayerIdsRef.current = pinnedLayerIds;
    const initialOrderRef = useRef(initialOrder);
    initialOrderRef.current = initialOrder;
    const municipioContextRef = useRef(municipioContext);
    municipioContextRef.current = municipioContext;

    const handleLoadStart = useCallback((layerId) => {
        setLayerLoading(layerId, true);
    }, [setLayerLoading]);

    const handleLoadEnd = useCallback((layerId) => {
        setLayerLoading(layerId, false);
    }, [setLayerLoading]);

    const wmsConfigCache = useMemo(() => {
        const cache = new Set();
        debouncedActiveLayerIds.forEach(id => {
            if (hasWMSConfig(id, layers)) {
                cache.add(id);
            }
        });
        return cache;
    }, [debouncedActiveLayerIds, layers]);

    const updateActiveLayers = useCallback(() => {
        if (!mapRef.current) return;

        if (isFirstRender.current && !filtersInitializationComplete.value) {
            return;
        }

        isFirstRender.current = false;

        const isInegiMode = debouncedActiveLayerIds.some(id => INEGI_LAYER_IDS.includes(id));
        const envParam = isInegiMode ? 'geom:geom_inegi' : 'geom:geom_iieg';

        const performUpdate = () => {
            const currentGroupKeys = new Set(wmsLayersRef.current.keys());

            const layerGroups = new Map();

            debouncedActiveLayerIds.forEach((id, index) => {
                if (debouncedHiddenLayerIds.includes(id)) return;
                if (vectorLayerIds.has(id)) return;

                if (wmsConfigCache.has(id)) {
                    const wmsConfig = findWMSConfig(id, layers);
                    if (wmsConfig) {
                        const groupKey = `${wmsConfig.baseUrl}|${wmsConfig.wmsGroup || 'default'}`;
                        if (!layerGroups.has(groupKey)) {
                            layerGroups.set(groupKey, []);
                        }
                        layerGroups.get(groupKey).push({ id, index, wmsConfig });
                    }
                }
            });

            currentGroupKeys.forEach(key => {
                if (!layerGroups.has(key)) {
                    const layer = wmsLayersRef.current.get(key);
                    if (layer) {
                        const mergedLayers = layer.get('mergedLayers');
                        if (mergedLayers) {
                            mergedLayers.forEach(merged => {
                                merged.subLayers.forEach(sub => handleLoadEnd(sub.id));
                            });
                        }
                        mapRef.current?.removeLayer(layer);
                        wmsLayersRef.current.delete(key);
                    }
                }
            });

            layerGroups.forEach((groupLayers, groupKey) => {
                const mergedLayersMap = new Map();

                groupLayers.forEach(layer => {
                    const name = layer.wmsConfig.layerName;
                    const styles = layer.wmsConfig.styles || '';
                    const key = `${name}|${styles}`;

                    if (!mergedLayersMap.has(key)) {
                        mergedLayersMap.set(key, {
                            layerName: name,
                            styles: styles,
                            wmsConfig: layer.wmsConfig,
                            index: layer.index,
                            subLayers: [{ id: layer.id, wmsConfig: layer.wmsConfig }]
                        });
                    } else {
                        const entry = mergedLayersMap.get(key);
                        if (layer.index < entry.index) {
                            entry.index = layer.index;
                        }
                        entry.subLayers.push({ id: layer.id, wmsConfig: layer.wmsConfig });
                    }
                });

                const mergedLayers = Array.from(mergedLayersMap.values());
                mergedLayers.sort((a, b) => a.index - b.index);
                const wmsLayersOrdered = [...mergedLayers].reverse();
                const firstLayer = wmsLayersOrdered[wmsLayersOrdered.length - 1];
                const representativeId = firstLayer.subLayers[0].id;
                const maxZIndex = computeLayerZIndex({
                    layerId: representativeId,
                    index: mergedLayers[0].index,
                    total: debouncedActiveLayerIds.length,
                    pinnedLayerIds: pinnedLayerIdsRef.current,
                    initialOrder: initialOrderRef.current
                });
                const layersParam = wmsLayersOrdered.map(l => l.layerName).join(',');
                const stylesParam = wmsLayersOrdered.map(l => l.styles).join(',');

                const ctx = municipioContextRef.current;

                const cqlFilterSegments = wmsLayersOrdered.map(merged => buildLayerCqlSegment({
                    subLayers: merged.subLayers,
                    layers,
                    getFilter: getFilterRef.current,
                    combineCQLFilters: combineCQLFiltersRef.current,
                    municipioContext: ctx
                }));

                const allInclude = cqlFilterSegments.every(f => f === 'INCLUDE');
                const finalCqlFilter = allInclude ? null : cqlFilterSegments.join(';');

                const timeSubLayers = wmsLayersOrdered.length === 1 ? wmsLayersOrdered[0].subLayers : null;
                const timeSub = isSingleTimeLayer(timeSubLayers) ? timeSubLayers[0] : null;
                const timeValue = timeSub ? getFilterRef.current?.(timeSub.id) : null;

                const customParams = {
                    LAYERS: layersParam,
                    STYLES: stylesParam,
                    ENV: envParam,
                };
                if (timeValue) {
                    customParams.TIME = timeValue;
                    const resolvedStyle = resolveTimeStyle(timeSub.wmsConfig.timeStylePattern, timeValue);
                    if (resolvedStyle) customParams.STYLES = resolvedStyle;
                } else if (finalCqlFilter) {
                    customParams.CQL_FILTER = finalCqlFilter;
                }

                const layerDef = findLayerById(representativeId, layers);
                const zoomRange = layerDef?.zoomRange;

                if (!wmsLayersRef.current.has(groupKey)) {
                    const layerRef = { current: null };

                    const onStart = () => {
                        const currentMerged = layerRef.current?.get('mergedLayers');
                        if (currentMerged) {
                            currentMerged.forEach(merged => {
                                merged.subLayers.forEach(sub => handleLoadStart(sub.id));
                            });
                        }
                    };

                    const onEnd = () => {
                        const currentMerged = layerRef.current?.get('mergedLayers');
                        if (currentMerged) {
                            currentMerged.forEach(merged => {
                                merged.subLayers.forEach(sub => handleLoadEnd(sub.id));
                            });
                        }
                    };

                    const opacity = getLayerOpacity ? getLayerOpacity(representativeId) : 1;
                    wmsLayersOrdered.forEach(merged => {
                        merged.subLayers.forEach(sub => handleLoadStart(sub.id));
                    });
                    const layer = createWMSLayer(representativeId, true, maxZIndex, customParams, onStart, onEnd, opacity);
                    if (layer && mapRef.current) {
                        if (zoomRange?.min != null) layer.setMinZoom(zoomRange.min);
                        if (zoomRange?.max != null) layer.setMaxZoom(zoomRange.max);
                        layerRef.current = layer;
                        layer.set('mergedLayers', wmsLayersOrdered);
                        mapRef.current.addLayer(layer);
                        wmsLayersRef.current.set(groupKey, layer);
                    }
                } else {
                    const layer = wmsLayersRef.current.get(groupKey);
                    if (layer) {
                        const oldMerged = layer.get('mergedLayers');
                        const newSubLayerIds = new Set();
                        wmsLayersOrdered.forEach(merged => {
                            merged.subLayers.forEach(sub => newSubLayerIds.add(sub.id));
                        });
                        if (oldMerged) {
                            oldMerged.forEach(merged => {
                                merged.subLayers.forEach(sub => {
                                    if (!newSubLayerIds.has(sub.id)) {
                                        handleLoadEnd(sub.id);
                                    }
                                });
                            });
                        }
                        layer.set('mergedLayers', wmsLayersOrdered);

                        if (zoomRange?.min != null && layer.getMinZoom() !== zoomRange.min) layer.setMinZoom(zoomRange.min);
                        if (zoomRange?.max != null && layer.getMaxZoom() !== zoomRange.max) layer.setMaxZoom(zoomRange.max);

                        if (layer.getZIndex() !== maxZIndex) {
                            layer.setZIndex(maxZIndex);
                        }

                        if (!layer.getVisible()) {
                            layer.setVisible(true);
                        }

                        const source = layer.getSource();
                        if (source && source.updateParams) {
                            const currentParams = source.getParams();

                            const newParams = {
                                LAYERS: layersParam,
                                STYLES: stylesParam,
                                ENV: envParam,
                            };

                            let paramsChanged = false;
                            if (currentParams.LAYERS !== newParams.LAYERS) paramsChanged = true;
                            if (currentParams.STYLES !== newParams.STYLES) paramsChanged = true;
                            if (currentParams.ENV !== newParams.ENV) paramsChanged = true;

                            if (finalCqlFilter) {
                                if (currentParams.CQL_FILTER !== finalCqlFilter) paramsChanged = true;
                            } else {
                                if (currentParams.CQL_FILTER) paramsChanged = true;
                            }

                            if (paramsChanged) {
                                if (finalCqlFilter) {
                                    newParams.CQL_FILTER = finalCqlFilter;
                                } else if (currentParams.CQL_FILTER) {
                                    newParams.CQL_FILTER = undefined;
                                }

                                if (newParams.CQL_FILTER === undefined && currentParams.CQL_FILTER) {
                                    const params = { ...currentParams, ...newParams };
                                    delete params.CQL_FILTER;
                                    source.updateParams(params);
                                } else {
                                    source.updateParams(newParams);
                                }
                                source.refresh();
                            }
                        }
                    }
                }
            });
        };

        performUpdate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedActiveLayerIds, debouncedHiddenLayerIds, wmsConfigCache, createWMSLayer, vectorLayerIds]);

    useEffect(updateActiveLayers, [updateActiveLayers]);

    useEffect(() => {
        updateActiveLayers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pinnedLayerIds, initialOrder]);

    useEffect(() => {
        if (!mapRef.current || !getLayerOpacity) return;

        requestAnimationFrame(() => {
            wmsLayersRef.current.forEach((layer) => {
                const mergedLayers = layer.get('mergedLayers');
                if (mergedLayers && mergedLayers.length > 0) {
                    const firstLayer = mergedLayers[mergedLayers.length - 1];
                    const representativeId = firstLayer.subLayers[0].id;
                    const opacity = getLayerOpacity(representativeId);

                    if (layer.getOpacity() !== opacity) {
                        layer.setOpacity(opacity);
                        layer.changed();
                    }
                }
            });

            if (mapRef.current) {
                mapRef.current.render();
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layerOpacities, getLayerOpacity]);

    useEffect(() => {
        const layersMap = wmsLayersRef.current;
        const currentMap = mapRef.current;

        return () => {
            if (currentMap && layersMap) {
                layersMap.forEach(layer => {
                    currentMap.removeLayer(layer);
                });
                layersMap.clear();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { wmsLayersRef };
};
