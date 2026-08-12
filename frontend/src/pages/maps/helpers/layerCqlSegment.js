import { findLayerById } from './layers/utils/layerHelpers';
import { buildLayerMunicipioCql } from './municipioCqlBuilder';

export const RASTER_WORKSPACES = new Set(['raster', 'lluvia', 'temperatura']);

export const buildLayerCqlSegment = ({ subLayers, layers, getFilter, combineCQLFilters, municipioContext }) => {
    const subFilters = subLayers.map(sub => {
        const baseCqlFilter = sub.wmsConfig.cqlFilter?.trim() || null;
        const dynamicFilter = getFilter?.(sub.id);
        return combineCQLFilters?.(baseCqlFilter, dynamicFilter) ?? null;
    }).filter(f => f);

    let segment;
    if (subFilters.length === 0) {
        const hasDefaultDate = subLayers.some(sub => findLayerById(sub.id, layers)?.defaultDate);
        segment = hasDefaultDate ? '1=0' : 'INCLUDE';
    } else {
        segment = subFilters.map(f => `(${f})`).join(' OR ');
    }

    if (municipioContext?.active && segment !== '1=0') {
        const isRaster = subLayers.some(sub => RASTER_WORKSPACES.has(sub.wmsConfig?.workspace));
        if (!isRaster) {
            const firstSub = subLayers[0];
            const layerDef = findLayerById(firstSub.id, layers);
            const muniCql = buildLayerMunicipioCql(layerDef?.searchMeta, municipioContext, firstSub.id);
            if (muniCql) {
                segment = segment === 'INCLUDE' ? muniCql : `(${muniCql}) AND (${segment})`;
            }
        }
    }

    return segment;
};
