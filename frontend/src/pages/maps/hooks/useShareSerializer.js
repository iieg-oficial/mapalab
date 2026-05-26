import { useCallback } from 'react';
import { toLonLat } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import { useMapsContext } from '@hooks/useMaps';
import { useLayers } from '@hooks/useLayers';
import { findLayerDef, slugForLayer } from '@pages/maps/helpers/wmsConfig';

const ANNOTATION_GEOJSON = new GeoJSON({
    featureProjection: 'EPSG:3857',
    dataProjection: 'EPSG:4326',
});

const ANNOTATION_TYPES = new Set(['LineString', 'Polygon', 'Freehand', 'Text', 'Emoji']);

const serializeAnnotations = (measurements) => {
    if (!Array.isArray(measurements) || measurements.length === 0) return null;
    const out = [];
    measurements.forEach((m) => {
        if (!m?.feature || !ANNOTATION_TYPES.has(m.type)) return;
        let geometry;
        try {
            geometry = ANNOTATION_GEOJSON.writeGeometryObject(m.feature.getGeometry());
        } catch {
            return;
        }
        const entry = {
            id: m.id,
            type: m.type,
            geometry,
            visible: m.visible !== false,
        };
        if (m.label) entry.label = m.label;
        if (m.value !== undefined && m.value !== null) entry.value = m.value;
        const textLabel = m.feature.get('textLabel');
        if (textLabel) entry.textLabel = textLabel;
        const rotation = m.feature.get('rotation');
        if (typeof rotation === 'number') entry.rotation = rotation;
        out.push(entry);
    });
    return out.length > 0 ? out : null;
};

const round = (value, decimals) => {
    if (value === null || value === undefined || Number.isNaN(value)) return value;
    const f = 10 ** decimals;
    return Math.round(value * f) / f;
};

const serializeFilters = (rawFilters) => {
    const out = {};
    Object.entries(rawFilters || {}).forEach(([key, value]) => {
        if (key.startsWith('_')) return;
        if (value === undefined || value === null || value === '') return;
        out[key] = value;
    });
    return out;
};

const serializeLoop = (dateLoops, loopPrefs, layerTree) => {
    const playing = Object.entries(dateLoops || {}).find(([, l]) => l && l.isPlaying);
    if (!playing) return null;
    const [layerId, state] = playing;
    const slug = slugForLayer(layerId, layerTree);
    return {
        layerSlug: slug,
        mode: state.mode || 'year',
        intervalMs: loopPrefs?.intervalMs || 1000,
        direction: loopPrefs?.direction || 'ltr',
        playing: true,
        currentValue: state.currentValue || null,
    };
};

const opacityFor = (opacities, id) => {
    if (opacities instanceof Map) return opacities.get(id) ?? 1;
    return opacities?.[id] ?? 1;
};

const serializePaneLayers = (snapshot, layerTree) => {
    const ids = snapshot?.activeLayerIds || [];
    const hidden = new Set(snapshot?.hiddenLayerIds || []);
    return ids
        .map(id => {
            const layer = findLayerDef(id, layerTree);
            if (!layer || layer.isLabel || layer.isCategory) return null;
            const slug = slugForLayer(id, layerTree);
            return {
                slug,
                visible: !hidden.has(id),
                opacity: round(opacityFor(snapshot?.layerOpacities, id), 2),
                filters: serializeFilters(snapshot?.filters?.[id]),
            };
        })
        .filter(Boolean);
};

export const useShareSerializer = () => {
    const {
        activeLayerIds,
        hiddenLayerIds,
        layerOpacities,
        filters,
        selectedLayerForSymbology,
        baseMapId,
        dateLoops,
        loopPrefs,
        mapRef,
        compareMode,
        measurements,
        municipioMode,
    } = useMapsContext();
    const { layers: layerTree } = useLayers();

    return useCallback((kind = 'single', extra = {}) => {
        const annotations = extra.includeAnnotations ? serializeAnnotations(measurements) : null;
        const view = (() => {
            const map = mapRef?.current;
            if (!map) return null;
            const olView = map.getView();
            const center = olView.getCenter();
            const zoom = olView.getZoom();
            if (!center) return null;
            const [lon, lat] = toLonLat(center);
            return {
                zoom: round(zoom, 2),
                lon: round(lon, 6),
                lat: round(lat, 6),
                rotation: round(olView.getRotation() || 0, 4),
            };
        })();

        const hidden = new Set(hiddenLayerIds || []);
        const layers = (activeLayerIds || [])
            .map(id => {
                const layer = findLayerDef(id, layerTree);
                if (!layer || layer.isLabel || layer.isCategory) return null;
                const slug = slugForLayer(id, layerTree);
                return {
                    slug,
                    visible: !hidden.has(id),
                    opacity: round(opacityFor(layerOpacities, id), 2),
                    filters: serializeFilters(filters?.[id]),
                };
            })
            .filter(Boolean);

        const selectedSlug = selectedLayerForSymbology?.id ? slugForLayer(selectedLayerForSymbology.id, layerTree) : null;

        const municipioPayload = (municipioMode?.active && Array.isArray(municipioMode.selected) && municipioMode.selected.length > 0)
            ? { source: municipioMode.sourceId || 'iieg', selected: [...municipioMode.selected] }
            : null;

        const basePayload = {
            view,
            basemap: baseMapId || null,
            selected: selectedSlug,
            layers,
            loop: serializeLoop(dateLoops, loopPrefs, layerTree),
        };
        if (annotations) basePayload.annotations = annotations;
        if (municipioPayload) basePayload.municipios = municipioPayload;

        if (kind === 'swipe') {
            const activeSlot = compareMode?.activeSlot || extra.activeSlot || 'A';
            const livePane = {
                ...(compareMode?.[`pane${activeSlot}`] || {}),
                activeLayerIds: activeLayerIds || [],
                hiddenLayerIds: hiddenLayerIds || [],
                layerOpacities,
                filters: filters || {},
            };
            const otherSlot = activeSlot === 'A' ? 'B' : 'A';
            const frozenPane = compareMode?.[`pane${otherSlot}`] || {};
            const paneA = activeSlot === 'A' ? livePane : frozenPane;
            const paneB = activeSlot === 'A' ? frozenPane : livePane;
            const sharedPayload = {
                view,
                basemap: baseMapId || null,
                selected: selectedSlug,
            };
            if (municipioPayload) sharedPayload.municipios = municipioPayload;
            const swipePayload = {
                shared: sharedPayload,
                paneA: {
                    label: paneA.label || 'A',
                    layers: serializePaneLayers(paneA, layerTree),
                },
                paneB: {
                    label: paneB.label || 'B',
                    layers: serializePaneLayers(paneB, layerTree),
                },
                activeSlot,
                position: typeof extra.position === 'number' ? extra.position : (compareMode?.swipePosition ?? 0.5),
            };
            if (annotations) swipePayload.annotations = annotations;
            return {
                version: 2,
                kind: 'swipe',
                payload: swipePayload,
            };
        }

        return {
            version: 2,
            kind: 'single',
            payload: basePayload,
        };
    }, [activeLayerIds, hiddenLayerIds, layerOpacities, filters, selectedLayerForSymbology, baseMapId, dateLoops, loopPrefs, mapRef, layerTree, compareMode, measurements, municipioMode]);
};
