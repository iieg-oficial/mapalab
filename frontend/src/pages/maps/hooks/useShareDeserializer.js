import { useCallback } from 'react';
import { fromLonLat } from 'ol/proj';
import { useMapsContext } from '@hooks/useMaps';
import { useLayers } from '@hooks/useLayers';
import { resolveRefToId } from '@pages/maps/helpers/wmsConfig';

export const useShareDeserializer = () => {
    const {
        setActiveLayerIds,
        getAllChildLayerIds,
        applyFilter,
        setSelectedLayerForSymbology,
        findLayerById,
        setLayerOpacity,
        setHiddenLayerIds,
        setBaseMapId,
        mapRef,
        setCompareMode,
    } = useMapsContext();
    const { layers: layerTree } = useLayers();

    return useCallback((envelope) => {
        if (!envelope || envelope.version !== 1) return false;
        if (envelope.kind !== 'single' && envelope.kind !== 'swipe') return false;
        const isSwipe = envelope.kind === 'swipe';
        const payload = isSwipe ? (envelope.payload?.base || {}) : (envelope.payload || {});
        const layers = Array.isArray(payload.layers) ? payload.layers : [];

        const resolvedIds = [];
        const hidden = [];
        const opacities = {};

        layers.forEach((entry) => {
            const layerId = resolveRefToId(entry.slug, layerTree);
            if (!layerId) return;
            if (!resolvedIds.includes(layerId)) {
                resolvedIds.push(layerId);
                getAllChildLayerIds(layerId).forEach((childId) => {
                    if (!resolvedIds.includes(childId)) resolvedIds.push(childId);
                });
            }
            if (entry.visible === false) hidden.push(layerId);
            if (typeof entry.opacity === 'number') opacities[layerId] = entry.opacity;

            Object.entries(entry.filters || {}).forEach(([name, cql]) => {
                if (cql) applyFilter(layerId, name, cql);
            });
        });

        setActiveLayerIds(resolvedIds);
        if (typeof setHiddenLayerIds === 'function') setHiddenLayerIds(hidden);
        if (typeof setLayerOpacity === 'function') {
            Object.entries(opacities).forEach(([id, op]) => setLayerOpacity(id, op));
        }

        if (payload.basemap && typeof setBaseMapId === 'function') {
            setBaseMapId(payload.basemap);
        }

        if (payload.view && mapRef?.current) {
            const map = mapRef.current;
            const olView = map.getView();
            if (typeof payload.view.lon === 'number' && typeof payload.view.lat === 'number') {
                olView.setCenter(fromLonLat([payload.view.lon, payload.view.lat]));
            }
            if (typeof payload.view.zoom === 'number') {
                olView.setZoom(payload.view.zoom);
            }
            if (typeof payload.view.rotation === 'number') {
                olView.setRotation(payload.view.rotation);
            }
        }

        if (payload.selected) {
            const selectedId = resolveRefToId(payload.selected, layerTree);
            if (selectedId) {
                const selectedLayer = findLayerById(selectedId);
                if (selectedLayer) setSelectedLayerForSymbology(selectedLayer);
            }
        }

        if (isSwipe && typeof setCompareMode === 'function') {
            const axis = envelope.payload?.axis || 'date';
            const panes = Array.isArray(envelope.payload?.panes) ? envelope.payload.panes : [];
            const swipePosition = typeof envelope.payload?.position === 'number'
                ? envelope.payload.position
                : 0.5;
            if (panes.length >= 2) {
                setCompareMode({ active: true, axis, panes, swipePosition });
            }
        } else if (typeof setCompareMode === 'function') {
            setCompareMode({ active: false, axis: 'date', panes: [], swipePosition: 0.5 });
        }

        return true;
    }, [setActiveLayerIds, getAllChildLayerIds, applyFilter, setSelectedLayerForSymbology, findLayerById, setLayerOpacity, setHiddenLayerIds, setBaseMapId, mapRef, layerTree, setCompareMode]);
};
