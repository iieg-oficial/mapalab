import { useCallback, useRef } from 'react';
import { fromLonLat } from 'ol/proj';
import { transformExtent } from 'ol/proj';
import { trackLayerToggle } from '@services/analyticsService';
import { generateDefaultDateFilter } from '@pages/maps/helpers/dateFilterHelpers';
import { findParentGroup } from '@pages/maps/helpers/layers/utils/layerHelpers';
import { buildLayerMunicipioCql, CQL_SIN_RESOLVER } from '@pages/maps/helpers/municipioCqlBuilder';
import { useLayers } from '@hooks/useLayers';
import { dateColumnOf, getLayerPeriodicity } from '@services/layerMetadataService';
import { fetchLayerExtent } from '@services/layerExtentService';
import { JALISCO_BOUNDS } from '@pages/maps/helpers/wmsConfig';

const FIT_PADDING = [40, 40, 40, 40];
const FIT_MAX_ZOOM = 18;
const FIT_DURATION = 500;

export const useLayerToggle = ({
    setActiveLayerIds,
    getAllChildLayerIds,
    findLayerById,
    setSelectedLayer,
    setSelectedLayerForSymbology,
    applyFilter,
    clearFilter,
    periodicityCache,
    mapRef,
    showMarker,
    hideMarker,
    municipioModeRef
}) => {
    const { layers: allLayers } = useLayers();
    const pendingDefaults = useRef(new Set());

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

    const defaultDateOf = useCallback((layer) => {
        if (!layer) return null;
        if (layer.defaultDate || !layer.forceGroup) return layer.defaultDate || null;
        const child = getAllChildLayerIds(layer.id).map(id => findLayerById(id)).find(node => node?.defaultDate);
        return child?.defaultDate || null;
    }, [getAllChildLayerIds, findLayerById]);

    const applyDefaultDate = useCallback(async (layerId) => {
        const target = findParentGroup(layerId, allLayers) || findLayerById(layerId);
        const defaultDate = defaultDateOf(target);
        if (!defaultDate) return;
        const targetId = target.id;
        if (pendingDefaults.current.has(targetId)) return;
        pendingDefaults.current.add(targetId);

        try {
            const dateToApply = await resolveDefaultDate(defaultDate, targetId);
            if (!dateToApply) return;

            const cql = generateDefaultDateFilter(dateToApply, defaultDate?.column || dateColumnOf(targetId));
            if (cql) applyFilter(targetId, 'date', cql);
        } catch (err) {
            console.error('Error resolving default date for layer', err);
            if (defaultDate !== 'latest') {
                const fallbackCql = generateDefaultDateFilter(defaultDate, defaultDate?.column || dateColumnOf(targetId));
                if (fallbackCql) applyFilter(targetId, 'date', fallbackCql);
            }
        } finally {
            pendingDefaults.current.delete(targetId);
        }
    }, [findLayerById, applyFilter, resolveDefaultDate, defaultDateOf, allLayers]);

    const clearDefaultDate = useCallback((layerId) => {
        if (defaultDateOf(findLayerById(layerId))) clearFilter(layerId, 'date');
    }, [findLayerById, clearFilter, defaultDateOf]);

    const applyDefaultZoom = useCallback(async (layerId) => {
        const layer = findLayerById(layerId);
        if (!layer?.defaultZoom || !mapRef?.current) return;

        const view = mapRef.current.getView();
        const config = layer.defaultZoom;

        if (config === 'fit' || config?.fit === true) {
            const ctx = municipioModeRef?.current?.municipioContext;
            const municipioCql = ctx?.active
                ? buildLayerMunicipioCql(layer?.searchMeta, ctx, layerId)
                : null;
            if (municipioCql === CQL_SIN_RESOLVER) return;
            const extent = await fetchLayerExtent(layer, { municipioCql });
            if (extent && mapRef.current) {
                view.fit(extent, { duration: FIT_DURATION, maxZoom: FIT_MAX_ZOOM, padding: FIT_PADDING });
            }
            return;
        }

        if (typeof config === 'number') {
            view.animate({
                center: fromLonLat(JALISCO_BOUNDS.center),
                zoom: config,
                duration: FIT_DURATION
            });
        } else if (config.extent) {
            const extent = transformExtent(config.extent, 'EPSG:4326', 'EPSG:3857');
            view.fit(extent, { duration: FIT_DURATION, maxZoom: FIT_MAX_ZOOM });
        } else if (config.zoom) {
            const center = config.center
                ? fromLonLat(config.center)
                : fromLonLat(JALISCO_BOUNDS.center);
            view.animate({ center, zoom: config.zoom, duration: FIT_DURATION });
        }
    }, [findLayerById, mapRef, municipioModeRef]);

    const handleToggleLayer = useCallback((layerId, isActive, options = false) => {
        const opts = options && typeof options === 'object' ? options : { skipAnalytics: !!options };
        const skipAnalytics = !!opts.skipAnalytics;
        if (!skipAnalytics) trackLayerToggle(layerId, isActive, opts.analytics);
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
                applyDefaultZoom(layerId);
                const layerDef = findLayerById(layerId);
                if (layerDef?.marker) {
                    const markerConfig = Array.isArray(layerDef.marker) ? layerDef.marker : [layerDef.marker];
                    markerConfig.forEach(m => showMarker?.({ id: `layer_${layerId}_${m.center.join(',')}`, ...m }));
                }
            }

            const layer = findLayerById(layerId);
            if (layer) {
                const groupAncestor = findParentGroup(layerId, allLayers);
                const displayLayer = groupAncestor || layer;
                setSelectedLayerForSymbology(displayLayer);
                if (!skipAnalytics) {
                    setSelectedLayer({ id: displayLayer.id, name: displayLayer.label, silent: true });
                }
            }
        } else {
            const childLayerIds = getAllChildLayerIds(layerId);
            [layerId, ...childLayerIds].forEach(clearDefaultDate);

            const layerDef = findLayerById(layerId);
            if (layerDef?.marker) {
                const markerConfig = Array.isArray(layerDef.marker) ? layerDef.marker : [layerDef.marker];
                markerConfig.forEach(m => hideMarker?.(`layer_${layerId}_${m.center.join(',')}`));
            }
        }
    }, [setActiveLayerIds, getAllChildLayerIds, findLayerById, setSelectedLayer, setSelectedLayerForSymbology, applyDefaultDate, clearDefaultDate, applyDefaultZoom, showMarker, hideMarker, allLayers]);

    return { handleToggleLayer, applyDefaultDate };
};
