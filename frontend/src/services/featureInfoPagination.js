import { findWMSConfig } from '../pages/maps/helpers/wmsConfig';
import { combineCQLFilters, fetchGeometryColumns, getWfsUrl, filterValidLayers, groupLayersByUrl, parseResponse } from '../utils/featureInfoUtils';

const _clickBufferBbox = (map, coordinate, tolerancePx = 5) => {
    const view = map.getView();
    const resolution = view.getResolution() || 1;
    const buffer = resolution * tolerancePx;
    const [x, y] = coordinate;
    return [x - buffer, y - buffer, x + buffer, y + buffer];
};

const _parseHitsCount = (text) => {
    const m1 = text.match(/numberMatched="(\d+)"/);
    if (m1) return parseInt(m1[1], 10);
    const m2 = text.match(/numberOfFeatures="(\d+)"/);
    if (m2) return parseInt(m2[1], 10);
    return null;
};

const _hitsParamsForVersion = (version, typeName, cql) => version === '1.1.0'
    ? { service: 'WFS', version: '1.1.0', request: 'GetFeature', typeName, CQL_FILTER: cql, resultType: 'hits' }
    : { service: 'WFS', version: '2.0.0', request: 'GetFeature', typeNames: typeName, CQL_FILTER: cql, resultType: 'hits' };

const _fetchHitsWithFallback = async (baseUrl, typeName, cql) => {
    for (const version of ['2.0.0', '1.1.0']) {
        const params = _hitsParamsForVersion(version, typeName, cql);
        const url = baseUrl + '?' + new URLSearchParams(params).toString();
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (!res.ok) continue;
            const text = await res.text();
            const count = _parseHitsCount(text);
            if (count != null) return count;
        } catch { /* try next version */ }
    }
    return null;
};

export const fetchTotalsForClick = async (activeLayers, map, coordinate, getFilterFn = null, isInegiMode = false, allLayers = []) => {
    const validLayers = filterValidLayers(activeLayers, allLayers, findWMSConfig)
        .filter(({ wmsConfig }) => wmsConfig.wfsAvailable !== false);
    if (validLayers.length === 0) return {};

    const view = map.getView();
    const projection = view.getProjection?.();
    const projectionCode = projection?.getCode?.() || 'EPSG:3857';
    const bbox = _clickBufferBbox(map, coordinate);

    const layersByUrl = groupLayersByUrl(validLayers, getWfsUrl);
    const totals = {};

    await Promise.all(Object.entries(layersByUrl).map(async ([baseUrl, typeGroups]) => {
        const uniqueTypeNames = Object.keys(typeGroups);
        const localTypeNames = uniqueTypeNames.map(n => n.split(':')[1] || n);
        const geomColumns = await fetchGeometryColumns(baseUrl, uniqueTypeNames);

        await Promise.all(uniqueTypeNames.map(async (typeName, idx) => {
            const localName = localTypeNames[idx];
            const layerList = typeGroups[typeName];

            let geomCol = geomColumns[typeName] || 'the_geom';
            if (isInegiMode && geomCol === 'geom_iieg') geomCol = 'geom_inegi';

            const typeFilters = layerList.map(({ layer, wmsConfig }) => {
                const dynamicFilter = getFilterFn ? getFilterFn(layer.id) : null;
                const baseCqlFilter = wmsConfig.cqlFilter || null;
                return combineCQLFilters(baseCqlFilter, dynamicFilter);
            }).filter(f => f);

            const bboxFilter = `BBOX(${geomCol}, ${bbox.join(', ')}, '${projectionCode}')`;
            const cql = typeFilters.length > 0
                ? `((${typeFilters.join(') OR (')})) AND ${bboxFilter}`
                : bboxFilter;

            // Siempre guardamos el page context — habilita lazy load aun si hits no responde
            totals[`__ctx__${layerList[0].layer.id}`] = { baseUrl, localName, cql, projectionCode };
            const count = await _fetchHitsWithFallback(baseUrl, localName, cql);
            if (count != null) {
                layerList.forEach(({ layer }) => { totals[layer.id] = count; });
            } else {
                console.warn('[fetchTotalsForClick] WFS hits sin respuesta para', localName, '— se intentara paginar a ciegas');
            }
        }));
    }));

    return totals;
};

export const fetchMoreFeaturesForLayer = async ({ baseUrl, localName, cql, projectionCode, count = 50, startIndex = 0 }) => {
    if (!baseUrl || !localName) return [];
    const params = {
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: localName,
        outputFormat: 'application/json',
        srsName: projectionCode || 'EPSG:3857',
        CQL_FILTER: cql || 'INCLUDE',
        count: String(count),
        startIndex: String(startIndex),
    };
    const url = baseUrl + '?' + new URLSearchParams(params).toString();
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) return [];
        const data = await parseResponse(res);
        if (!data?.features) return [];
        return data.features;
    } catch {
        return [];
    }
};
