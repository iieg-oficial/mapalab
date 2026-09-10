import { RASTER_WORKSPACES } from './layerCqlSegment';
import { findLayerDef } from './wmsConfig';

export const SERVICE_WMS = 'wms';
export const SERVICE_VECTOR = 'vector';
export const SERVICE_HEXBIN = 'hexbin';

export const LOCAL_SERVICES = new Set([SERVICE_VECTOR, SERVICE_HEXBIN]);

export const VECTOR_LAYER_FLAG = 'mapalabVectorService';

export const VECTOR_FEATURE_LIMIT = 20000;

const VECTOR_GEOMETRY_TYPES = new Set(['point', 'line', 'polygon']);

export const canUseVectorService = (layerDef) => {
    if (!layerDef || layerDef.isLabel || layerDef.isCategory) return false;
    if (Array.isArray(layerDef.children) && layerDef.children.length > 0) return false;

    const wmsConfig = layerDef.wmsConfig;
    if (!wmsConfig || wmsConfig.wfsAvailable === false) return false;
    if (RASTER_WORKSPACES.has(wmsConfig.workspace)) return false;

    return VECTOR_GEOMETRY_TYPES.has(layerDef.geometryType);
};

export const isVectorService = (mode) => LOCAL_SERVICES.has(mode);

export const hasHexbinMode = (layerIds, getServiceMode) => {
    if (!Array.isArray(layerIds) || typeof getServiceMode !== 'function') return false;
    return layerIds.some(id => getServiceMode(id) === SERVICE_HEXBIN);
};

export const resolveVectorTargets = (childIds, allLayers, activeLayerIds, options = {}) => {
    if (!Array.isArray(childIds) || childIds.length === 0) return [];
    const active = Array.isArray(activeLayerIds) ? new Set(activeLayerIds) : null;

    return childIds
        .filter(id => !active || active.has(id))
        .map(id => findLayerDef(id, allLayers || []))
        .filter(canUseVectorService)
        .filter(layerDef => !options.pointsOnly || layerDef.geometryType === 'point')
        .map(layerDef => layerDef.id);
};
