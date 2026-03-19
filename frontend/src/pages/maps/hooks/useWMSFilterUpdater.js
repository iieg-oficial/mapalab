import { useEffect, useRef } from 'react';
import { resolveTimeStyle } from '../helpers/wmsConfig';

const INEGI_LAYER_IDS = ['limite_inegi', 'limite_municipal_inegi'];

export const useWMSFilterUpdater = ({ mapRef, wmsLayersRef, filters, getFilter, combineCQLFilters, activeLayerIds }) => {
    const activeLayerIdsRef = useRef(activeLayerIds);
    activeLayerIdsRef.current = activeLayerIds;

    useEffect(() => {
        if (!mapRef.current || !getFilter) return;

        const isInegiMode = activeLayerIdsRef.current.some(id => INEGI_LAYER_IDS.includes(id));
        const envParam = isInegiMode ? 'geom:geom_inegi' : 'geom:geom_iieg';

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
                        const filters = mergedLayers.map(merged => {
                            const subFilters = merged.subLayers.map(sub => {
                                const wmsConfig = sub.wmsConfig;
                                const baseCqlFilter = wmsConfig.cqlFilter && wmsConfig.cqlFilter.trim() !== '' ? wmsConfig.cqlFilter : null;
                                const dynamicFilter = getFilter(sub.id);
                                const combined = combineCQLFilters(baseCqlFilter, dynamicFilter);
                                return combined ? `(${combined})` : null;
                            }).filter(f => f);

                            if (subFilters.length === 0) return 'INCLUDE';
                            return subFilters.join(' OR ');
                        });

                        const allInclude = filters.every(f => f === 'INCLUDE');
                        if (!allInclude) {
                            combinedFilter = filters.join(';');
                        }
                    }
                } else {
                    const layerWmsConfig = layer.get('wmsConfig');
                    if (!layerWmsConfig) return;

                    const baseCqlFilter = layerWmsConfig.cqlFilter && layerWmsConfig.cqlFilter.trim() !== '' ? layerWmsConfig.cqlFilter : null;
                    const dynamicFilter = getFilter(key);
                    const combined = combineCQLFilters(baseCqlFilter, dynamicFilter);
                    combinedFilter = combined || null;
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
    }, [filters, getFilter, combineCQLFilters]);
};
