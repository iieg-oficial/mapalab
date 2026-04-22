const WMS_BASE_CONFIG = {
    format: 'image/png',
    transparent: true,
    version: '1.1.0',
    srs: 'EPSG:6368'
};

export const JALISCO_BOUNDS = {
    coords: [-105.70, 18.95, -101.47, 22.75],
    center: [-103.585, 20.85],
    zoom: 8
};

const GEOSERVER_BASE = (import.meta.env.VITE_GEOSERVER_URL || '').replace(/\/+$/, '');

export const hydrateWmsConfig = (wmsConfig) => {
    if (!wmsConfig) return null;
    const gsWorkspace = wmsConfig.geoserverWorkspace || wmsConfig.workspace;
    const gsLayer = wmsConfig.geoserverLayer;
    if (!gsWorkspace || !gsLayer) return null;
    return {
        ...WMS_BASE_CONFIG,
        ...wmsConfig,
        baseUrl: `${GEOSERVER_BASE}/${gsWorkspace}/wms`,
        layerName: `${gsWorkspace}:${gsLayer}`,
    };
};

const hydrateNode = (node) => {
    if (!node) return node;
    const result = {
        ...node,
        wmsConfig: node.wmsConfig ? hydrateWmsConfig(node.wmsConfig) : node.wmsConfig,
    };
    if (Array.isArray(node.children)) {
        result.children = node.children.map(hydrateNode);
    }
    return result;
};

export const hydrateLayerTree = (tree) => Array.isArray(tree) ? tree.map(hydrateNode) : tree;

export const findWMSConfig = (layerId, layersArray) => {
    for (const layer of layersArray) {
        if (layer.id === layerId && layer.wmsConfig) {
            return layer.wmsConfig;
        }
        if (layer.children) {
            const found = findWMSConfig(layerId, layer.children);
            if (found) return found;
        }
    }

    return null;
};

export const hasWMSConfig = (layerId, layersArray) => {
    return findWMSConfig(layerId, layersArray) !== null;
};

export const resolveTimeStyle = (pattern, timeValue) => {
    if (!pattern || !timeValue) return null;
    const [year, month] = timeValue.split('-');
    return pattern.replace('{year}', year).replace('{month}', month);
};

export const findLayerDef = (layerId, layersArray) => {
    for (const layer of layersArray) {
        if (layer.id === layerId) return layer;
        if (layer.children) {
            const found = findLayerDef(layerId, layer.children);
            if (found) return found;
        }
    }
    return null;
};