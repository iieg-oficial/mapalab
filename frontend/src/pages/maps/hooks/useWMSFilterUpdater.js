import { useEffect } from 'react';
import { useDebounce } from '@hooks/useDebounce';
import { resolveTimeStyle } from '../helpers/wmsConfig';

export const useWMSFilterUpdater = ({ mapRef, wmsLayersRef, filters, getFilter, combineCQLFilters, activeLayerIds }) => {
    const debouncedFilters = useDebounce(filters, 300);
    const debouncedActiveLayers = useDebounce(activeLayerIds, 300);

    useEffect(() => {
        if (!mapRef.current || !getFilter) return;

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

                if (timeValue !== undefined) {
                    const resolvedStyle = resolveTimeStyle(timeStylePattern, timeValue);
                    const timeChanged = currentParams.TIME !== timeValue;
                    const styleChanged = resolvedStyle && currentParams.STYLES !== resolvedStyle;
                    if (timeChanged || styleChanged) {
                        const updates = { TIME: timeValue, CQL_FILTER: undefined };
                        if (resolvedStyle) updates.STYLES = resolvedStyle;
                        source.updateParams(updates);
                    }
                } else {
                    const newCqlFilter = combinedFilter || undefined;
                    if (currentParams.CQL_FILTER !== newCqlFilter) {
                        source.updateParams({ CQL_FILTER: newCqlFilter, TIME: undefined });
                        source.refresh();
                    }
                }
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedFilters, debouncedActiveLayers, getFilter, combineCQLFilters]);
};
