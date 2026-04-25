import { useCallback } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useLayers } from '@hooks/useLayers';
import { findLayerDef, slugForLayer } from '@pages/maps/helpers/wmsConfig';

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

export const useShareSerializer = () => {
    const {
        activeLayerIds,
        hiddenLayerIds,
        layerOpacities,
        filters,
        selectedLayer,
        baseMapId,
        dateLoops,
        loopPrefs,
        mapRef,
    } = useMapsContext();
    const { layers: layerTree } = useLayers();

    return useCallback((kind = 'single', extra = {}) => {
        const view = (() => {
            const map = mapRef?.current;
            if (!map) return null;
            const olView = map.getView();
            const center = olView.getCenter();
            const zoom = olView.getZoom();
            if (!center) return null;
            const [lon, lat] = center;
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
                    opacity: round(layerOpacities?.[id] ?? 1, 2),
                    filters: serializeFilters(filters?.[id]),
                };
            })
            .filter(Boolean);

        const selectedSlug = selectedLayer?.id ? slugForLayer(selectedLayer.id, layerTree) : null;

        const basePayload = {
            view,
            basemap: baseMapId || null,
            selected: selectedSlug,
            layers,
            loop: serializeLoop(dateLoops, loopPrefs, layerTree),
        };

        if (kind === 'compare') {
            return {
                version: 1,
                kind: 'compare',
                payload: {
                    base: basePayload,
                    axis: extra.axis || 'date',
                    panes: extra.panes || [],
                },
            };
        }

        return {
            version: 1,
            kind: 'single',
            payload: basePayload,
        };
    }, [activeLayerIds, hiddenLayerIds, layerOpacities, filters, selectedLayer, baseMapId, dateLoops, loopPrefs, mapRef, layerTree]);
};
