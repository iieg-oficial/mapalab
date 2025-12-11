import { useEffect, useCallback, useRef, useMemo } from 'react';
import { hasWMSConfig, findWMSConfig } from '../helpers/wmsConfig';
import { layers } from '../helpers/layers/index';
import { filtersInitializationComplete } from './useInitializeFromUrl';
import { useDebounce } from '@hooks/useDebounce';
import { useMapsContext } from '@hooks/useMaps';

export const useWMSLayerManager = ({ mapRef, activeLayerIds, hiddenLayerIds, unifiedLayers, createWMSLayer, getAllChildLayerIds, getLayerOpacity, layerOpacities }) => {
    const wmsLayersRef = useRef(new Map());
    const isFirstRender = useRef(true);
    const debouncedActiveLayerIds = useDebounce(activeLayerIds, 100);
    const debouncedHiddenLayerIds = useDebounce(hiddenLayerIds, 100);
    const debouncedUnifiedLayers = useDebounce(unifiedLayers, 100);
    const { setLayerLoading } = useMapsContext();

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
    }, [debouncedActiveLayerIds]);

    const updateActiveLayers = useCallback(() => {
        if (!mapRef.current) return;

        if (isFirstRender.current && !filtersInitializationComplete.value) {
            return;
        }

        isFirstRender.current = false;

        const performUpdate = () => {
            const currentGroupKeys = new Set(wmsLayersRef.current.keys());

            const layerGroups = new Map();

            debouncedActiveLayerIds.forEach((id, index) => {
                if (debouncedHiddenLayerIds.includes(id)) return;

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
                        layer.setVisible(false);
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
                const minIndex = mergedLayers[0].index;
                const totalLayers = debouncedActiveLayerIds.length;
                const maxZIndex = (totalLayers - minIndex) + 100;
                const layersParam = wmsLayersOrdered.map(l => l.layerName).join(',');
                const stylesParam = wmsLayersOrdered.map(l => l.styles).join(',');

                const cqlFilterParam = wmsLayersOrdered.map(merged => {
                    const filters = merged.subLayers
                        .map(sub => sub.wmsConfig.cqlFilter)
                        .filter(f => f && f.trim() !== '');

                    if (filters.length === 0) return 'INCLUDE';
                    return filters.map(f => `(${f})`).join(' OR ');
                }).join(';');

                const hasAnyFilter = wmsLayersOrdered.some(merged =>
                    merged.subLayers.some(sub => sub.wmsConfig.cqlFilter)
                );
                const finalCqlFilter = hasAnyFilter ? cqlFilterParam : null;

                const customParams = {
                    LAYERS: layersParam,
                    STYLES: stylesParam,
                };
                if (finalCqlFilter) {
                    customParams.CQL_FILTER = finalCqlFilter;
                }

                if (!wmsLayersRef.current.has(groupKey)) {
                    const onStart = () => {
                        mergedLayers.forEach(merged => {
                            merged.subLayers.forEach(sub => handleLoadStart(sub.id));
                        });
                    };

                    const onEnd = () => {
                        mergedLayers.forEach(merged => {
                            merged.subLayers.forEach(sub => handleLoadEnd(sub.id));
                        });
                    };

                    const opacity = getLayerOpacity ? getLayerOpacity(representativeId) : 1;
                    const layer = createWMSLayer(representativeId, true, maxZIndex, customParams, onStart, onEnd, opacity);
                    if (layer && mapRef.current) {
                        layer.set('mergedLayers', wmsLayersOrdered);
                        mapRef.current.addLayer(layer);
                        wmsLayersRef.current.set(groupKey, layer);
                    }
                } else {
                    const layer = wmsLayersRef.current.get(groupKey);
                    if (layer) {
                        layer.set('mergedLayers', wmsLayersOrdered);

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
                                STYLES: stylesParam
                            };

                            let paramsChanged = false;
                            if (currentParams.LAYERS !== newParams.LAYERS) paramsChanged = true;
                            if (currentParams.STYLES !== newParams.STYLES) paramsChanged = true;

                            let newCqlFilterValue = undefined;
                            if (finalCqlFilter) {
                                newCqlFilterValue = finalCqlFilter;
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

        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(performUpdate, { timeout: 100 });
        } else {
            setTimeout(performUpdate, 0);
        }
    }, [debouncedActiveLayerIds, debouncedHiddenLayerIds, wmsConfigCache, createWMSLayer]);

    const layerUpdates = useMemo(() => {
        return debouncedUnifiedLayers.map((layer, index) => {
            const zIndex = 100 + (debouncedUnifiedLayers.length - index);
            return {
                id: layer.id,
                visible: layer.visible,
                zIndex
            };
        });
    }, [debouncedUnifiedLayers]);

    const updateLayerProperties = useCallback(() => {
        if (!mapRef.current) return;

        requestAnimationFrame(() => {
            layerUpdates.forEach(update => {
                const wmsConfig = findWMSConfig(update.id, layers);
                if (!wmsConfig) return;

                const groupKey = wmsConfig.layerName;
                const layer = wmsLayersRef.current.get(groupKey);

                if (layer) {
                    if (layer.getVisible() !== update.visible) {
                        layer.setVisible(update.visible);
                    }
                    if (layer.getZIndex() !== update.zIndex) {
                        layer.setZIndex(update.zIndex);
                        layer.changed();
                    }
                }
            });

            if (mapRef.current) {
                mapRef.current.render();
            }
        });
    }, [layerUpdates, getAllChildLayerIds]);

    useEffect(updateActiveLayers, [updateActiveLayers]);

    useEffect(updateLayerProperties, [updateLayerProperties]);

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
    }, []);

    return { wmsLayersRef };
};
