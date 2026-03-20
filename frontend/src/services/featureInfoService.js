import { findWMSConfig } from '../pages/maps/helpers/wmsConfig';
import { layers } from '../pages/maps/helpers/layers/index';
import { combineCQLFilters, fetchGeometryColumns, getWmsUrl, getWfsUrl, filterValidLayers, groupLayersByUrl, parseResponse } from '../utils/featureInfoUtils';

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

export const getFeatureInfoForActiveLayers = async (activeLayers, map, coordinate, getFilterFn = null, isInegiMode = false) => {
    const validLayers = filterValidLayers(activeLayers, layers, findWMSConfig);

    if (validLayers.length === 0) return [];

    const layersByBaseUrl = groupLayersByUrl(validLayers, getWmsUrl);

    const promises = Object.entries(layersByBaseUrl).map(async ([baseUrl, layerGroups]) => {
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
                    cqlFilters.push(`(${groupFilters.join(') OR (')})`);
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
                FEATURE_COUNT: '50',
                X: Math.floor(pixel[0]).toString(),
                Y: Math.floor(pixel[1]).toString(),
                CQL_FILTER: cqlFilters.join(';'),
                ENV: isInegiMode ? 'geom:geom_inegi' : 'geom:geom_iieg',
                ...(timeValue ? { TIME: timeValue } : {})
            };

            const url = baseUrl + '?' + new URLSearchParams(params).toString();
            const response = await fetch(url);

            const data = await parseResponse(response);
            if (!data) return null;

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
    });

    const results = await Promise.all(promises);
    return results.flat().filter(r => r !== null);
};

export const getFeaturesInPolygonForActiveLayers = async (activeLayers, map, polygonGeometry, getFilterFn = null, isInegiMode = false) => {
    const validLayers = filterValidLayers(activeLayers, layers, findWMSConfig)
        .filter(({ wmsConfig }) => wmsConfig.wfsAvailable !== false);

    if (validLayers.length === 0) return [];

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
            const extent = polygonGeometry.getExtent();

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

                const bboxFilter = `BBOX(${geomCol}, ${extent[0]}, ${extent[1]}, ${extent[2]}, ${extent[3]}, '${projectionCode}')`;

                if (typeFilters.length > 0) {
                    cqlFilters.push(`((${typeFilters.join(') OR (')})) AND ${bboxFilter}`);
                } else {
                    cqlFilters.push(bboxFilter);
                }
            });

            const params = {
                SERVICE: 'WFS',
                VERSION: '1.1.0',
                REQUEST: 'GetFeature',
                TYPENAME: localTypeNames.join(','),
                OUTPUTFORMAT: 'application/json',
                SRSNAME: projectionCode,
                CQL_FILTER: cqlFilters.join(';')
            };

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

            return Object.values(resultsByLayerId).map(({ layer, features }) => {
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
    });

    const results = await Promise.allSettled(promises);

    return results
        .map(result => {
            if (result.status === 'fulfilled' && result.value !== null) {
                return result.value;
            }
            return null;
        })
        .flat()
        .filter(info => info !== null && info.features && info.features.length > 0);
};
