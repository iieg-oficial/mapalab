import { useEffect, useRef } from 'react';
import { resolveTimeStyle } from '../helpers/wmsConfig';
import { findLayerById } from '../helpers/layers/utils/layerHelpers';
import { buildLayerMunicipioCql } from '../helpers/municipioCqlBuilder';
import { useLayers } from '@hooks/useLayers';

const INEGI_LAYER_IDS = ['limite_inegi', 'limite_municipal_inegi'];
const RASTER_WORKSPACES = new Set(['raster', 'lluvia', 'temperatura']);
const EMPTY_MUNICIPIO_CTX = { active: false, claves: [], nombres: [], bbox: null };

export const useWMSFilterUpdater = ({ mapRef, wmsLayersRef, filters, getFilter, combineCQLFilters, activeLayerIds, municipioContext = EMPTY_MUNICIPIO_CTX }) => {
    const { layers } = useLayers();
    const activeLayerIdsRef = useRef(activeLayerIds);
    activeLayerIdsRef.current = activeLayerIds;
    const municipioContextRef = useRef(municipioContext);
    municipioContextRef.current = municipioContext;
    const layersRef = useRef(layers);
    layersRef.current = layers;

    useEffect(() => {
        if (!mapRef.current || !getFilter) return;

        const isInegiMode = activeLayerIdsRef.current.some(id => INEGI_LAYER_IDS.includes(id));
        const envParam = isInegiMode ? 'geom:geom_inegi' : 'geom:geom_iieg';
        const ctx = municipioContextRef.current;
        const layersTree = layersRef.current;

        requestAnimationFrame(() => {
            wmsLayersRef.current.forEach((layer, key) => {
                const mergedLayers = layer.get('mergedLayers');
                const source = layer.getSource();
                if (!source || !source.updateParams) return;

                let combinedFilter = null;
                let timeValue = undefined;
                let timeStylePattern = null;

                if (mergedLayers && mergedLayers.length > 0) {
                    const isTimeLayer = mergedLayers.length === 1
                        && mergedLayers[0].subLayers.length === 1
                        && mergedLayers[0].subLayers[0].wmsConfig?.timeEnabled;

                    if (isTimeLayer) {
                        const sub = mergedLayers[0].subLayers[0];
                        timeValue = getFilter(sub.id) || undefined;
                        timeStylePattern = sub.wmsConfig.timeStylePattern;
                    } else {
                        const segments = mergedLayers.map(merged => {
                            const subFilters = merged.subLayers.map(sub => {
                                const wmsConfig = sub.wmsConfig;
                                const baseCqlFilter = wmsConfig.cqlFilter && wmsConfig.cqlFilter.trim() !== '' ? wmsConfig.cqlFilter : null;
                                const dynamicFilter = getFilter(sub.id);
                                const combined = combineCQLFilters(baseCqlFilter, dynamicFilter);
                                return combined ? `(${combined})` : null;
                            }).filter(f => f);

                            let segment = subFilters.length === 0 ? 'INCLUDE' : subFilters.join(' OR ');

                            if (ctx?.active) {
                                const isRaster = merged.subLayers.some(sub => RASTER_WORKSPACES.has(sub.wmsConfig?.workspace));
                                if (!isRaster) {
                                    const firstSub = merged.subLayers[0];
                                    const layerDef = findLayerById(firstSub.id, layersTree);
                                    const muniCql = buildLayerMunicipioCql(layerDef?.searchMeta, ctx, firstSub.id);
                                    if (muniCql) {
                                        segment = segment === 'INCLUDE' ? muniCql : `(${muniCql}) AND (${segment})`;
                                    }
                                }
                            }

                            return segment;
                        });

                        const allInclude = segments.every(f => f === 'INCLUDE');
                        if (!allInclude) {
                            combinedFilter = segments.join(';');
                        }
                    }
                } else {
                    const layerWmsConfig = layer.get('wmsConfig');
                    if (!layerWmsConfig) return;

                    const baseCqlFilter = layerWmsConfig.cqlFilter && layerWmsConfig.cqlFilter.trim() !== '' ? layerWmsConfig.cqlFilter : null;
                    const dynamicFilter = getFilter(key);
                    const combined = combineCQLFilters(baseCqlFilter, dynamicFilter);
                    let segment = combined || null;

                    if (ctx?.active && !RASTER_WORKSPACES.has(layerWmsConfig.workspace)) {
                        const layerDef = findLayerById(key, layersTree);
                        const muniCql = buildLayerMunicipioCql(layerDef?.searchMeta, ctx, key);
                        if (muniCql) {
                            segment = segment ? `(${muniCql}) AND (${segment})` : muniCql;
                        }
                    }

                    combinedFilter = segment;
                }

                const currentParams = source.getParams();

                const envChanged = currentParams.ENV !== envParam;

                if (timeValue !== undefined) {
                    const resolvedStyle = resolveTimeStyle(timeStylePattern, timeValue);
                    const timeChanged = currentParams.TIME !== timeValue;
                    const styleChanged = resolvedStyle && currentParams.STYLES !== resolvedStyle;
                    if (timeChanged || styleChanged || envChanged) {
                        const updates = { TIME: timeValue, CQL_FILTER: undefined, ENV: envParam };
                        if (resolvedStyle) updates.STYLES = resolvedStyle;
                        source.updateParams(updates);
                    }
                } else {
                    const newCqlFilter = combinedFilter || undefined;
                    if (currentParams.CQL_FILTER !== newCqlFilter || envChanged) {
                        source.updateParams({ CQL_FILTER: newCqlFilter, TIME: undefined, ENV: envParam });
                        source.refresh();
                    }
                }
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, getFilter, combineCQLFilters, municipioContext]);
};
