
const geometryColumnCache = {};
const geometryTypeCache = {};

export const combineCQLFilters = (baseFilter, dynamicFilter) => {
    if (!baseFilter && !dynamicFilter) return null;
    if (!baseFilter) return dynamicFilter;
    if (!dynamicFilter) return baseFilter;
    return `(${baseFilter}) AND (${dynamicFilter})`;
};

export const fetchGeometryColumns = async (baseUrl, typeNames) => {
    const globalWfsUrl = baseUrl.replace(/\/(?:[^/]+\/)?wms$/, '/wfs');
    const missingTypes = typeNames.filter(name => !geometryColumnCache[`${baseUrl}:${name}`]);

    if (missingTypes.length > 0) {
        try {
            const params = {
                SERVICE: 'WFS',
                VERSION: '1.1.0',
                REQUEST: 'DescribeFeatureType',
                TYPENAME: missingTypes.join(','),
                OUTPUTFORMAT: 'text/xml; subtype=gml/3.1.1'
            };

            const url = globalWfsUrl + '?' + new URLSearchParams(params).toString();
            const response = await fetch(url);
            if (!response.ok) throw new Error(response.statusText);

            const text = await response.text();
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

                const matchedTypeName = missingTypes.find(t => t.endsWith(':' + typeName) || t === typeName);
                if (matchedTypeName) {
                    const cacheKey = `${baseUrl}:${matchedTypeName}`;
                    geometryColumnCache[cacheKey] = geomName;
                    geometryTypeCache[cacheKey] = geomType;
                }
            }

        } catch { /* DescribeFeatureType is best-effort */ }
    }

    const result = {};
    typeNames.forEach(name => {
        result[name] = geometryColumnCache[`${baseUrl}:${name}`] || 'the_geom';
    });
    return result;
};

export const fetchGeometryType = async (baseUrl, typeName) => {
    const cacheKey = `${baseUrl}:${typeName}`;
    if (geometryTypeCache[cacheKey]) return geometryTypeCache[cacheKey];
    await fetchGeometryColumns(baseUrl, [typeName]);
    return geometryTypeCache[cacheKey] || 'unknown';
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
