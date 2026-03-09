import { useCallback } from 'react';
import { trackLayerToggle } from '@services/analyticsService';
import { generateDefaultDateFilter } from '@pages/maps/helpers/dateFilterHelpers';

export const useLayerToggle = ({
    setActiveLayerIds,
    getAllChildLayerIds,
    findLayerById,
    setSelectedLayer,
    applyFilter,
    clearFilter
}) => {
    const applyDefaultDate = useCallback((layerId) => {
        const layer = findLayerById(layerId);
        if (!layer?.defaultDate) return;

        const cql = generateDefaultDateFilter(layer.defaultDate, layer.defaultDate.column || 'fecha');
        if (cql) applyFilter(layerId, 'date', cql);
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
