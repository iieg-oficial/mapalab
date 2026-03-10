import { useCallback } from 'react';
import { trackLayerToggle } from '@services/analyticsService';
import { generateDefaultDateFilter } from '@pages/maps/helpers/dateFilterHelpers';

import { getLayerMetadata } from '@services/layerMetadataService';

export const useLayerToggle = ({
    setActiveLayerIds,
    getAllChildLayerIds,
    findLayerById,
    setSelectedLayer,
    applyFilter,
    clearFilter
}) => {
    const applyDefaultDate = useCallback(async (layerId) => {
        const layer = findLayerById(layerId);
        if (!layer?.defaultDate) return;

        let dateToApply = layer.defaultDate;

        if (dateToApply === 'latest') {
            try {
                const metadata = await getLayerMetadata(layerId);
                const periodicity = metadata?.periodicity?.fecha || metadata?.periodicity;
                
                if (periodicity && typeof periodicity === 'object') {
                    const availableYears = Object.keys(periodicity).map(Number).sort((a, b) => b - a);
                    if (availableYears.length > 0) {
                        const latestYear = availableYears[0];
                        const availableMonths = Object.keys(periodicity[latestYear]).map(Number).sort((a, b) => b - a);
                        
                        dateToApply = { year: latestYear };
                        if (availableMonths.length > 0) {
                            dateToApply.month = availableMonths[0];
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching latest date for layer', err);
                return;
            }
        }

        if (dateToApply && dateToApply !== 'latest') {
            const cql = generateDefaultDateFilter(dateToApply, layer.defaultDate?.column || 'fecha');
            if (cql) applyFilter(layerId, 'date', cql);
        }
    }, [findLayerById, applyFilter]);

    const clearDefaultDate = useCallback((layerId) => {
        const layer = findLayerById(layerId);
        if (layer?.defaultDate) clearFilter(layerId, 'date');
    }, [findLayerById, clearFilter]);

    const handleToggleLayer = useCallback((layerId, isActive, skipAnalytics = false) => {
        if (!skipAnalytics) trackLayerToggle(layerId, isActive);
        setActiveLayerIds(prevActiveIds => {
            const childLayerIds = getAllChildLayerIds(layerId);
            const allRelatedIds = [layerId, ...childLayerIds];

            if (isActive) {
                const filteredIds = prevActiveIds.filter(id => !allRelatedIds.includes(id));
                return [...allRelatedIds, ...filteredIds];
            } else {
                return prevActiveIds.filter(id => !allRelatedIds.includes(id));
            }
        });

        if (isActive) {
            const childLayerIds = getAllChildLayerIds(layerId);
            [layerId, ...childLayerIds].forEach(applyDefaultDate);

            if (!skipAnalytics) {
                const layer = findLayerById(layerId);
                if (layer) setSelectedLayer({ id: layer.id, name: layer.label });
            }
        } else {
            const childLayerIds = getAllChildLayerIds(layerId);
            [layerId, ...childLayerIds].forEach(clearDefaultDate);
        }
    }, [setActiveLayerIds, getAllChildLayerIds, findLayerById, setSelectedLayer, applyDefaultDate, clearDefaultDate]);

    return { handleToggleLayer };
};
