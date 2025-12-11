import { useEffect } from 'react';
import { useDebounce } from '@hooks/useDebounce';
import { findWMSConfig } from '../helpers/wmsConfig';
import { layers } from '../helpers/layers/index';
export const useWMSFilterUpdater = ({ mapRef, wmsLayersRef, filters, getFilter, combineCQLFilters, activeLayerIds }) => {
    const debouncedFilters = useDebounce(filters, 300);
    const debouncedActiveLayers = useDebounce(activeLayerIds, 300);

    useEffect(() => {
        if (!mapRef.current || !getFilter) return;

        requestAnimationFrame(() => {
            wmsLayersRef.current.forEach((layer, key) => {
                const mergedLayers = layer.get('mergedLayers');

                let combinedFilter = null;

                if (mergedLayers && mergedLayers.length > 0) {
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
                } else {
                    if (!wmsConfig) return;

                    const baseCqlFilter = wmsConfig.cqlFilter && wmsConfig.cqlFilter.trim() !== '' ? wmsConfig.cqlFilter : null;
                    const dynamicFilter = getFilter(key);
                    const combined = combineCQLFilters(baseCqlFilter, dynamicFilter);
                    combinedFilter = combined || null;
                }

                const source = layer.getSource();
                if (source && source.updateParams) {
                    const currentParams = source.getParams();
                    const newCqlFilter = combinedFilter || undefined;

                    if (currentParams.CQL_FILTER !== newCqlFilter) {
                        if (newCqlFilter) {
                            source.updateParams({ CQL_FILTER: newCqlFilter });
                        } else {
                            const params = { ...currentParams };
                            delete params.CQL_FILTER;
                            source.updateParams(params);
                        }
                        source.refresh();
                    }
                }
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedFilters, debouncedActiveLayers, getFilter, combineCQLFilters]);
};
