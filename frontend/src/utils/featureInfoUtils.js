
const MAX_GEOMETRY_CACHE_SIZE = 500;
const NEGATIVE_TTL_MS = 60_000;

const geometryColumnCache = new Map();
const geometryTypeCache = new Map();
const negativeCache = new Map();
const inflightByKey = new Map();
const pendingByUrl = new Map();
const resolversByKey = new Map();

const setBounded = (map, key, value) => {
    if (map.has(key)) map.delete(key);
    map.set(key, value);
    if (map.size > MAX_GEOMETRY_CACHE_SIZE) {
        const oldestKey = map.keys().next().value;
        map.delete(oldestKey);
    }
};

const isNegativeCached = (cacheKey) => {
    const expiresAt = negativeCache.get(cacheKey);
    if (expiresAt == null) return false;
    if (Date.now() >= expiresAt) {
        negativeCache.delete(cacheKey);
        return false;
    }
    return true;
};

export const combineCQLFilters = (baseFilter, dynamicFilter) => {
    if (!baseFilter && !dynamicFilter) return null;
    if (!baseFilter) return dynamicFilter;
    if (!dynamicFilter) return baseFilter;
    return `(${baseFilter}) AND (${dynamicFilter})`;
};

const IGUALDAD_SIMPLE = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*('(?:[^']|'')*'|-?\d+(?:\.\d+)?)$/;

export const joinCQLFilters = (filters) => {
    const limpios = (filters || []).map(f => String(f ?? '').trim()).filter(f => f);
    if (limpios.length === 0) return null;
    if (limpios.length === 1) return `(${limpios[0]})`;

    const igualdades = limpios.map(f => IGUALDAD_SIMPLE.exec(f));
    if (igualdades.every(Boolean) && new Set(igualdades.map(m => m[1])).size === 1) {
        return `${igualdades[0][1]} IN (${igualdades.map(m => m[2]).join(',')})`;
    }

    return limpios.map(f => `(${f})`).join(' OR ');
};

const parseDescribeFeatureType = (text, baseUrl, typeNames) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    const complexTypes = xmlDoc.getElementsByTagNameNS('http://www.w3.org/2001/XMLSchema', 'complexType');

    for (let i = 0; i < complexTypes.length; i++) {
        const complexType = complexTypes[i];
        const typeName = complexType.getAttribute('name').replace('Type', '');

        const elements = complexType.getElementsByTagNameNS('http://www.w3.org/2001/XMLSchema', 'element');
        let geomName = 'the_geom';
        let geomType = 'unknown';

        for (let j = 0; j < elements.length; j++) {
            const el = elements[j];
            const type = el.getAttribute('type');
            if (type && (type.includes('Geometry') || type.includes('Polygon') || type.includes('Point') || type.includes('Line') || type.includes('Curve') || type.includes('Surface'))) {
                geomName = el.getAttribute('name');
                if (type.includes('Point')) geomType = 'point';
                else if (type.includes('Line') || type.includes('Curve')) geomType = 'line';
                else if (type.includes('Polygon') || type.includes('Surface')) geomType = 'polygon';
                break;
            }
        }

        const matchedTypeName = typeNames.find(t => t.endsWith(':' + typeName) || t === typeName);
        if (matchedTypeName) {
            const cacheKey = `${baseUrl}:${matchedTypeName}`;
            setBounded(geometryColumnCache, cacheKey, geomName);
            setBounded(geometryTypeCache, cacheKey, geomType);
        }
    }
};

const flushBatch = async (baseUrl) => {
    const pending = pendingByUrl.get(baseUrl);
    if (!pending || pending.size === 0) {
        pendingByUrl.delete(baseUrl);
        return;
    }
    const typeNames = Array.from(pending);
    pendingByUrl.delete(baseUrl);

    const globalWfsUrl = baseUrl.replace(/\/(?:[^/]+\/)?wms$/, '/wfs');
    const params = {
        SERVICE: 'WFS',
        VERSION: '1.1.0',
        REQUEST: 'DescribeFeatureType',
        TYPENAME: typeNames.join(','),
        OUTPUTFORMAT: 'text/xml; subtype=gml/3.1.1'
    };

    try {
        const url = globalWfsUrl + '?' + new URLSearchParams(params).toString();
        const response = await fetch(url);
        if (!response.ok) throw new Error(response.statusText);
        const text = await response.text();
        parseDescribeFeatureType(text, baseUrl, typeNames);
    } catch { /* DescribeFeatureType is best-effort */ }

    typeNames.forEach(name => {
        const cacheKey = `${baseUrl}:${name}`;
        if (!geometryColumnCache.has(cacheKey)) {
            negativeCache.set(cacheKey, Date.now() + NEGATIVE_TTL_MS);
        }
        const resolvers = resolversByKey.get(cacheKey);
        resolversByKey.delete(cacheKey);
        inflightByKey.delete(cacheKey);
        if (resolvers) resolvers.forEach(r => r());
    });
};

const scheduleTypeName = (baseUrl, typeName) => {
    const cacheKey = `${baseUrl}:${typeName}`;
    const existing = inflightByKey.get(cacheKey);
    if (existing) return existing;

    const promise = new Promise(resolve => {
        let list = resolversByKey.get(cacheKey);
        if (!list) {
            list = [];
            resolversByKey.set(cacheKey, list);
        }
        list.push(resolve);

        let typeNames = pendingByUrl.get(baseUrl);
        if (!typeNames) {
            typeNames = new Set();
            pendingByUrl.set(baseUrl, typeNames);
            queueMicrotask(() => flushBatch(baseUrl));
        }
        typeNames.add(typeName);
    });
    inflightByKey.set(cacheKey, promise);
    return promise;
};

export const fetchGeometryColumns = async (baseUrl, typeNames) => {
    const toRequest = typeNames.filter(name => {
        const cacheKey = `${baseUrl}:${name}`;
        return !geometryColumnCache.has(cacheKey) && !isNegativeCached(cacheKey);
    });

    if (toRequest.length > 0) {
        await Promise.all(toRequest.map(name => scheduleTypeName(baseUrl, name)));
    }

    const result = {};
    typeNames.forEach(name => {
        result[name] = geometryColumnCache.get(`${baseUrl}:${name}`) || 'the_geom';
    });
    return result;
};

export const fetchGeometryType = async (baseUrl, typeName) => {
    const cacheKey = `${baseUrl}:${typeName}`;
    if (geometryTypeCache.has(cacheKey)) return geometryTypeCache.get(cacheKey);
    await fetchGeometryColumns(baseUrl, [typeName]);
    return geometryTypeCache.get(cacheKey) || 'unknown';
};

export const getWmsUrl = (url) => {
    return url.replace(/\/wfs\/?$/, '/wms');
};

export const getWfsUrl = (url) => {
    return url.replace(/\/wms\/?$/, '/wfs');
};

export const filterValidLayers = (activeLayers, layers, findWMSConfig) => {
    const seen = new Set();
    let validLayers = activeLayers
        .filter(layer => {
            if (!layer.visible || seen.has(layer.id)) return false;
            seen.add(layer.id);
            return true;
        })
        .map(layer => {
            const wmsConfig = findWMSConfig(layer.id, layers);
            return wmsConfig ? { layer, wmsConfig } : null;
        })
        .filter(item => item !== null);

    if (validLayers.length === 0) return [];

    const hasThematicLayers = validLayers.some(({ wmsConfig }) => wmsConfig.workspace !== 'general');
    if (hasThematicLayers) {
        validLayers = validLayers.filter(({ wmsConfig }) => wmsConfig.workspace !== 'general');
    }
    return validLayers;
};

export const groupLayersByUrl = (validLayers, urlNormalizer) => {
    const layersByUrl = {};
    validLayers.forEach(({ layer, wmsConfig }) => {
        const url = urlNormalizer(wmsConfig.baseUrl);

        if (!layersByUrl[url]) {
            layersByUrl[url] = {};
        }

        const layerName = wmsConfig.layerName;
        if (!layersByUrl[url][layerName]) {
            layersByUrl[url][layerName] = [];
        }
        layersByUrl[url][layerName].push({ layer, wmsConfig });
    });
    return layersByUrl;
};

export const parseResponse = async (response) => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else if (contentType && contentType.includes('text/plain')) {
        try {
            const text = await response.text();
            data = JSON.parse(text);
        } catch {
            return null;
        }
    } else {
        return null;
    }
    return data;
};
