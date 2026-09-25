import { useCallback } from 'react';
import { toLonLat } from 'ol/proj';
import { useMapsContext } from '@hooks/useMaps';
import { useLayers } from '@hooks/useLayers';
import { findLayerDef, slugForLayer } from '@pages/maps/helpers/wmsConfig';
import { serializeAnnotations } from '@pages/maps/helpers/annotationsSerialization';
import { SERVICE_WMS } from '@pages/maps/helpers/serviceMode';
import { serializarVista3d } from '@pages/maps/helpers/vista3dCompartida';

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
    const prefs = loopPrefs?.[layerId] || {};
    return {
        layerSlug: slugForLayer(layerId, layerTree),
        mode: state.mode || 'year',
        year: state.year ?? null,
        slot: state.slot ?? null,
        intervalMs: prefs.intervalMs || 1000,
        direction: prefs.direction || 'ltr',
        playing: true,
        currentKey: state.currentKey ?? null,
    };
};

const opacityFor = (opacities, id) => {
    if (opacities instanceof Map) return opacities.get(id) ?? 1;
    return opacities?.[id] ?? 1;
};

const serviceFor = (serviceModes, id) => {
    const mode = serviceModes instanceof Map ? serviceModes.get(id) : serviceModes?.[id];
    return mode && mode !== SERVICE_WMS ? mode : null;
};

const serializeLayerEntry = (id, layerTree, hidden, opacities, filters, serviceModes, sinFondo, palettes) => {
    const layer = findLayerDef(id, layerTree);
    if (!layer || layer.isLabel || layer.isCategory) return null;

    const entry = {
        slug: slugForLayer(id, layerTree),
        visible: !hidden.has(id),
        opacity: round(opacityFor(opacities, id), 2),
        filters: serializeFilters(filters?.[id]),
    };

    const service = serviceFor(serviceModes, id);
    if (service) entry.service = service;
    if (sinFondo?.has?.(id)) entry.fill = false;

    const tono = palettes?.get?.(id);
    if (service && Number.isInteger(tono)) entry.palette = tono;

    return entry;
};

const serializePaneLayers = (snapshot, layerTree, serviceModes, sinFondo, palettes) => {
    const ids = snapshot?.activeLayerIds || [];
    const hidden = new Set(snapshot?.hiddenLayerIds || []);
    return ids
        .map(id => serializeLayerEntry(id, layerTree, hidden, snapshot?.layerOpacities, snapshot?.filters, serviceModes, sinFondo, palettes))
        .filter(Boolean);
};

export const useShareSerializer = () => {
    const {
        activeLayerIds,
        hiddenLayerIds,
        layerOpacities,
        layerServiceModes,
        hexbinSinFondo,
        hexbinPalettes,
        soloSeleccionada,
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
            .map(id => serializeLayerEntry(id, layerTree, hidden, layerOpacities, filters, layerServiceModes, hexbinSinFondo, hexbinPalettes))
            .filter(Boolean);

        const selectedSlug = selectedLayerForSymbology?.id ? slugForLayer(selectedLayerForSymbology.id, layerTree) : null;
        const vista3d = serializarVista3d(extra.view3d, id => slugForLayer(id, layerTree));

        const municipioPayload = (municipioMode?.active && Array.isArray(municipioMode.selected) && municipioMode.selected.length > 0)
            ? {
                source: municipioMode.sourceId || 'iieg',
                selected: [...municipioMode.selected],
                ...(municipioMode.scope?.type ? { scope: { type: municipioMode.scope.type, value: municipioMode.scope.value ?? null } } : {}),
            }
            : null;

        const basePayload = {
            view,
            basemap: baseMapId || null,
            selected: selectedSlug,
            layers,
            loop: serializeLoop(dateLoops, loopPrefs, layerTree),
        };
        if (soloSeleccionada) basePayload.soloSeleccionada = true;
        if (annotations) basePayload.annotations = annotations;
        if (municipioPayload) basePayload.municipios = municipioPayload;
        if (vista3d) basePayload.vista3d = vista3d;

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
            if (vista3d) sharedPayload.vista3d = vista3d;
            const swipePayload = {
                shared: sharedPayload,
                paneA: {
                    label: paneA.label || 'A',
                    layers: serializePaneLayers(paneA, layerTree, layerServiceModes, hexbinSinFondo, hexbinPalettes),
                },
                paneB: {
                    label: paneB.label || 'B',
                    layers: serializePaneLayers(paneB, layerTree, layerServiceModes, hexbinSinFondo, hexbinPalettes),
                },
                activeSlot,
                loop: serializeLoop(dateLoops, loopPrefs, layerTree),
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
    }, [activeLayerIds, hiddenLayerIds, layerOpacities, layerServiceModes, hexbinSinFondo, hexbinPalettes, soloSeleccionada, filters, selectedLayerForSymbology, baseMapId, dateLoops, loopPrefs, mapRef, layerTree, compareMode, measurements, municipioMode]);
};
