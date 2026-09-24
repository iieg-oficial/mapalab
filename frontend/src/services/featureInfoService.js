import { findWMSConfig } from '../pages/maps/helpers/wmsConfig';
import { combineCQLFilters, joinCQLFilters, fetchGeometryColumns, getWmsUrl, getWfsUrl, filterValidLayers, groupLayersByUrl, parseResponse } from '../utils/featureInfoUtils';
import { filtroDePoligono, wktDelPoligono } from './seleccionStatsService';

export const FEATURE_COUNT_CAP = 50;
export const FEATURE_COUNT_TOTAL = 2000;
export const POLYGON_PAGE_SIZE = 200;

const matchesFilter = (properties, cqlFilter) => {
    if (!cqlFilter || !properties) return true;

    const ilikeMatch = cqlFilter.match(/(\w+)\s+ILIKE\s+'([^']+)'/i);
    if (ilikeMatch) {
        const [, field, value] = ilikeMatch;
        const propValue = properties[field];
        if (propValue) {
            return propValue.toLowerCase().includes(value.toLowerCase());
        }
        return false;
    }

    const equalsMatch = cqlFilter.match(/(\w+)\s*=\s*'([^']+)'/);
    if (equalsMatch) {
        const [, field, value] = equalsMatch;
        return properties[field] === value;
    }

    return true;
};

const queryWMSGetFeatureInfo = async (baseUrl, layerGroups, map, coordinate, getFilterFn, isInegiMode, featureCount) => {
    try {
        const uniqueLayerNames = [];
        const styles = [];
        const cqlFilters = [];
        const layerMap = {};
        let timeValue = null;

        Object.entries(layerGroups).forEach(([layerName, group]) => {
            uniqueLayerNames.push(layerName);
            styles.push(group[0].wmsConfig.styles || '');
            layerMap[layerName] = group[0].layer;

            const groupFilters = group.map(({ layer, wmsConfig }) => {
                const dynamicFilter = getFilterFn ? getFilterFn(layer.id) : null;

                if (dynamicFilter && /^\d{4}-\d{2}-\d{2}$/.test(dynamicFilter)) {
                    timeValue = dynamicFilter;
                    return wmsConfig.cqlFilter || null;
                }

                const baseCqlFilter = wmsConfig.cqlFilter || null;
                return combineCQLFilters(baseCqlFilter, dynamicFilter);
            }).filter(f => f);

            if (groupFilters.length > 0) {
                cqlFilters.push(`(${joinCQLFilters(groupFilters)})`);
            } else {
                cqlFilters.push('INCLUDE');
            }
        });

        const view = map.getView();
        const projection = view.getProjection?.();
        const projectionCode = projection?.getCode?.() || 'EPSG:3857';
        const size = map.getSize();
        const extent = view.calculateExtent(size);
        const pixel = map.getPixelFromCoordinate(coordinate);

        if (!pixel || pixel[0] < 0 || pixel[1] < 0 || pixel[0] > size[0] || pixel[1] > size[1]) {
            return null;
        }

        const params = {
            SERVICE: 'WMS',
            VERSION: '1.1.0',
            REQUEST: 'GetFeatureInfo',
            LAYERS: uniqueLayerNames.join(','),
            QUERY_LAYERS: uniqueLayerNames.join(','),
            STYLES: styles.join(','),
            BBOX: extent.join(','),
            WIDTH: size[0].toString(),
            HEIGHT: size[1].toString(),
            SRS: projectionCode,
            FORMAT: 'image/png',
            INFO_FORMAT: 'application/json',
            FEATURE_COUNT: String(featureCount),
            X: Math.floor(pixel[0]).toString(),
            Y: Math.floor(pixel[1]).toString(),
            CQL_FILTER: cqlFilters.join(';'),
            ENV: isInegiMode ? 'geom:geom_inegi' : 'geom:geom_iieg',
            ...(timeValue ? { TIME: timeValue } : {})
        };

        const url = baseUrl + '?' + new URLSearchParams(params).toString();
        const response = await fetch(url);

        const data = await parseResponse(response);
        if (!data || !data.features) return null;

        const resultsByLayer = {};

        data.features.forEach(feature => {
            const featureId = feature.id;

            let matchedLayerName = null;

            if (featureId) {
                matchedLayerName = uniqueLayerNames.find(name => {
                    const simpleName = name.split(':')[1] || name;
                    return featureId.startsWith(simpleName + '.') || featureId.includes(':' + simpleName + '.');
                });
            }

            if (!matchedLayerName && uniqueLayerNames.length === 1) {
                matchedLayerName = uniqueLayerNames[0];
            }

            if (matchedLayerName) {
                if (!resultsByLayer[matchedLayerName]) {
                    resultsByLayer[matchedLayerName] = [];
                }
                resultsByLayer[matchedLayerName].push(feature);
            }
        });

        return Object.entries(resultsByLayer).map(([layerName, features]) => {
            const layer = layerMap[layerName];
            return {
                layerName: layer.name,
                layerId: layer.id,
                features: features,
                totalFeatures: features.length,
                raw: data
            };
        });

    } catch {
        return null;
    }
};

export const getFeatureInfoForActiveLayers = async (activeLayers, map, coordinate, getFilterFn = null, isInegiMode = false, allLayers = [], featureCount = FEATURE_COUNT_CAP) => {
    const validLayers = filterValidLayers(activeLayers, allLayers, findWMSConfig);

    if (validLayers.length === 0) return [];

    const layersByBaseUrl = groupLayersByUrl(validLayers, getWmsUrl);

    const promises = Object.entries(layersByBaseUrl).map(async ([baseUrl, layerGroups]) => {
        const batchResult = await queryWMSGetFeatureInfo(baseUrl, layerGroups, map, coordinate, getFilterFn, isInegiMode, featureCount);
        if (batchResult !== null) return batchResult;

        const entries = Object.entries(layerGroups);
        if (entries.length <= 1) return null;

        const perLayerResults = await Promise.all(
            entries.map(([layerName, group]) =>
                queryWMSGetFeatureInfo(baseUrl, { [layerName]: group }, map, coordinate, getFilterFn, isInegiMode, featureCount),
            ),
        );
        return perLayerResults.filter(r => r !== null).flat();
    });

    const results = await Promise.all(promises);
    return results.flat().filter(r => r !== null);
};

export const getFeaturesInPolygonForActiveLayers = async (activeLayers, map, polygonGeometry, getFilterFn = null, isInegiMode = false, allLayers = [], page = {}) => {
    const startIndex = Number.isInteger(page.startIndex) ? page.startIndex : 0;
    const count = Number.isInteger(page.count) ? page.count : POLYGON_PAGE_SIZE;

    const validLayers = filterValidLayers(activeLayers, allLayers, findWMSConfig)
        .filter(({ wmsConfig }) => wmsConfig.wfsAvailable !== false);

    if (validLayers.length === 0) return { results: [], matched: 0, returned: 0, nextIndex: startIndex, hasMore: false };

    const layersByUrl = groupLayersByUrl(validLayers, getWfsUrl);

    const promises = Object.entries(layersByUrl).map(async ([baseUrl, typeGroups]) => {
        try {
            const uniqueTypeNames = Object.keys(typeGroups);
            const localTypeNames = uniqueTypeNames.map(name => {
                const parts = name.split(':');
                return parts.length > 1 ? parts[1] : name;
            });

            const localToFullMap = {};
            localTypeNames.forEach((local, index) => {
                localToFullMap[local] = uniqueTypeNames[index];
            });

            const geomColumns = await fetchGeometryColumns(baseUrl, uniqueTypeNames);
            const cqlFilters = [];
            const layerMap = {};
            const layerListMap = {};
            const view = map.getView();
            const projection = view.getProjection?.();
            const projectionCode = projection?.getCode?.() || 'EPSG:3857';
            const wkt = wktDelPoligono(polygonGeometry);

            uniqueTypeNames.forEach((typeName, index) => {
                const localName = localTypeNames[index];
                const layerList = typeGroups[typeName];
                layerMap[localName] = layerList[0].layer;
                layerListMap[localName] = layerList;

                let geomCol = geomColumns[typeName] || 'the_geom';
                if (isInegiMode && geomCol === 'geom_iieg') geomCol = 'geom_inegi';

                const typeFilters = layerList.map(({ layer, wmsConfig }) => {
                    const dynamicFilter = getFilterFn ? getFilterFn(layer.id) : null;
                    const baseCqlFilter = wmsConfig.cqlFilter || null;
                    return combineCQLFilters(baseCqlFilter, dynamicFilter);
                }).filter(f => f);

                const filtroEspacial = filtroDePoligono(geomCol, wkt, 'WITHIN');

                if (typeFilters.length > 0) {
                    cqlFilters.push(`(${joinCQLFilters(typeFilters)}) AND ${filtroEspacial}`);
                } else {
                    cqlFilters.push(filtroEspacial);
                }
            });

            const params = {
                SERVICE: 'WFS',
                VERSION: '2.0.0',
                REQUEST: 'GetFeature',
                TYPENAMES: localTypeNames.join(','),
                OUTPUTFORMAT: 'application/json',
                SRSNAME: projectionCode,
                CQL_FILTER: cqlFilters.join(';'),
                COUNT: String(count)
            };

            if (startIndex > 0) {
                params.STARTINDEX = String(startIndex);
            }

            const url = baseUrl + '?' + new URLSearchParams(params).toString();
            const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

            const data = await parseResponse(response);
            if (!data) return null;

            if (!data || !data.features) return null;

            const resultsByLayerId = {};

            data.features.forEach(feature => {
                const featureId = feature.id;
                if (!featureId) return;

                const matchedLocalName = localTypeNames.find(simpleName => {
                    return featureId.startsWith(simpleName + '.') || featureId.includes(':' + simpleName + '.');
                });

                if (matchedLocalName) {
                    const layerList = layerListMap[matchedLocalName];

                    if (layerList.length === 1) {
                        const { layer } = layerList[0];
                        if (!resultsByLayerId[layer.id]) {
                            resultsByLayerId[layer.id] = { layer, features: [] };
                        }
                        resultsByLayerId[layer.id].features.push(feature);
                    } else {
                        for (const { layer, wmsConfig } of layerList) {
                            const cqlFilter = wmsConfig.cqlFilter;
                            if (!cqlFilter || matchesFilter(feature.properties, cqlFilter)) {
                                if (!resultsByLayerId[layer.id]) {
                                    resultsByLayerId[layer.id] = { layer, features: [] };
                                }
                                resultsByLayerId[layer.id].features.push(feature);
                                break;
                            }
                        }
                    }
                }
            });

            const items = Object.values(resultsByLayerId).map(({ layer, features }) => {
                return {
                    layerName: layer.name,
                    layerId: layer.id,
                    features: features,
                    totalFeatures: features.length,
                    raw: data
                };
            });

            return {
                items,
                matched: Number(data.numberMatched) || 0,
                returned: Number(data.numberReturned) || items.reduce((n, i) => n + i.features.length, 0)
            };

        } catch {
            return null;
        }
    });

    const settled = await Promise.allSettled(promises);
    const pages = settled
        .map(r => (r.status === 'fulfilled' && r.value !== null ? r.value : null))
        .filter(Boolean);

    const results = pages
        .flatMap(p => p.items)
        .filter(info => info && info.features && info.features.length > 0);

    const matched = pages.reduce((n, p) => n + p.matched, 0);
    const returned = pages.reduce((n, p) => n + p.returned, 0);
    const nextIndex = startIndex + returned;

    return { results, matched, returned, nextIndex, hasMore: returned >= count && nextIndex < matched };
};

