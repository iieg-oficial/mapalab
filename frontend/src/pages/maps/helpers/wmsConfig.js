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

const WMS_WORKSPACES = {
    general: `${import.meta.env.VITE_GEOSERVER_URL}general/wms`,
    economia: `${import.meta.env.VITE_GEOSERVER_URL}economia/wms`,
    salud: `${import.meta.env.VITE_GEOSERVER_URL}salud/wms`,
    educacion: `${import.meta.env.VITE_GEOSERVER_URL}educacion/wms`,
    seguridad: `${import.meta.env.VITE_GEOSERVER_URL}seguridad_y_proteccion_ciudadana/wms`,
    recursos: `${import.meta.env.VITE_GEOSERVER_URL}recursos_y_calidad_de_vida/wms`,
    demografia: `${import.meta.env.VITE_GEOSERVER_URL}demografia/wms`,
    desarrollo: `${import.meta.env.VITE_GEOSERVER_URL}desarrollo_social/wms`,
    gobierno: `${import.meta.env.VITE_GEOSERVER_URL}gobierno_y_ciudadania/wms`
};

export const createWMSConfig = (workspace, layerName, styles = '', cqlFilter = '') => ({
    baseUrl: WMS_WORKSPACES[workspace],
    layerName: `${workspace}:${layerName}`,
    workspace,
    styles,
    cqlFilter,
    ...WMS_BASE_CONFIG
});

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