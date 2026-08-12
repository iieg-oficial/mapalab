import { RASTER_WORKSPACES } from './layerCqlSegment';

export const SERVICE_WMS = 'wms';
export const SERVICE_VECTOR = 'vector';

export const VECTOR_LAYER_FLAG = 'mapalabVectorService';

export const VECTOR_FEATURE_LIMIT = 20000;

export const VECTOR_SERVICE_ENABLED = ['dev', 'beta'].includes(import.meta.env.VITE_APP_ENV);

const VECTOR_GEOMETRY_TYPES = new Set(['point', 'line', 'polygon']);

export const canUseVectorService = (layerDef) => {
    if (!layerDef || layerDef.isLabel || layerDef.isCategory) return false;
    if (Array.isArray(layerDef.children) && layerDef.children.length > 0) return false;

    const wmsConfig = layerDef.wmsConfig;
    if (!wmsConfig || wmsConfig.wfsAvailable === false) return false;
    if (RASTER_WORKSPACES.has(wmsConfig.workspace)) return false;

    return VECTOR_GEOMETRY_TYPES.has(layerDef.geometryType);
};

export const isVectorService = (mode) => mode === SERVICE_VECTOR;
