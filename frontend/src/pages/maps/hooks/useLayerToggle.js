import { useCallback } from 'react';
import { trackLayerToggle } from '@services/analyticsService';
import { generateDefaultDateFilter } from '@pages/maps/helpers/dateFilterHelpers';
import { findParentGroup } from '@pages/maps/helpers/layers/utils/layerHelpers';
import { layers as allLayers } from '@pages/maps/helpers/layers/index';
import { getLayerPeriodicity } from '@services/layerMetadataService';

export const useLayerToggle = ({
    setActiveLayerIds,
    getAllChildLayerIds,
    findLayerById,
    setSelectedLayer,
    setSelectedLayerForSymbology,
    applyFilter,
    clearFilter,
    periodicityCache
}) => {
    const resolveDefaultDate = useCallback(async (dateToApply, layerId) => {
        let periodicity = periodicityCache.getPeriodicity(layerId);
        if (!periodicity) {
            periodicity = await getLayerPeriodicity(layerId);
        }
        if (!periodicity || typeof periodicity !== 'object') return dateToApply === 'latest' ? null : dateToApply;

        const availableYears = Object.keys(periodicity).map(Number).sort((a, b) => b - a);
        if (availableYears.length === 0) return null;

        if (dateToApply === 'latest') {
            const latestYear = availableYears[0];
            const availableMonths = Object.keys(periodicity[latestYear]).map(Number).sort((a, b) => b - a);
            const resolved = { year: latestYear };
            if (availableMonths.length > 0) resolved.month = availableMonths[0];
            return resolved;
        }

        const targetYear = dateToApply.year;
        if (periodicity[targetYear]) return dateToApply;

        const fallbackYear = availableYears.find(y => y < targetYear) || availableYears[0];
        const availableMonths = Object.keys(periodicity[fallbackYear]).map(Number).sort((a, b) => b - a);
        const resolved = { ...dateToApply, year: fallbackYear };
        if (dateToApply.month != null && !availableMonths.includes(dateToApply.month)) {
            resolved.month = availableMonths[0];
        }
        return resolved;
    }, [periodicityCache]);

    const applyDefaultDate = useCallback(async (layerId) => {
        const layer = findLayerById(layerId);
        if (!layer?.defaultDate) return;

        try {
            const dateToApply = await resolveDefaultDate(layer.defaultDate, layerId);
            if (!dateToApply) return;

            const cql = generateDefaultDateFilter(dateToApply, layer.defaultDate?.column || 'fecha');
            if (cql) applyFilter(layerId, 'date', cql);
        } catch (err) {
            console.error('Error resolving default date for layer', err);
            if (layer.defaultDate && layer.defaultDate !== 'latest') {
                const fallbackCql = generateDefaultDateFilter(layer.defaultDate, layer.defaultDate?.column || 'fecha');
                if (fallbackCql) applyFilter(layerId, 'date', fallbackCql);
            }
        }
    }, [findLayerById, applyFilter, resolveDefaultDate]);

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

            const layer = findLayerById(layerId);
            if (layer) {
                const groupAncestor = findParentGroup(layerId, allLayers);
                const displayLayer = groupAncestor || layer;
                setSelectedLayerForSymbology(displayLayer);
                if (!skipAnalytics) {
                    setSelectedLayer({ id: displayLayer.id, name: displayLayer.label });
                }
            }
        } else {
            const childLayerIds = getAllChildLayerIds(layerId);
            [layerId, ...childLayerIds].forEach(clearDefaultDate);
        }
    }, [setActiveLayerIds, getAllChildLayerIds, findLayerById, setSelectedLayer, setSelectedLayerForSymbology, applyDefaultDate, clearDefaultDate]);

    return { handleToggleLayer };
};
