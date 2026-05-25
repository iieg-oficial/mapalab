import { useCallback } from 'react';
import { fromLonLat } from 'ol/proj';
import { useMapsContext } from '@hooks/useMaps';
import { useLayers } from '@hooks/useLayers';
import { resolveRefToId } from '@pages/maps/helpers/wmsConfig';
import { initialCompareMode } from '@pages/maps/helpers/swipeMode';

const buildPaneFromEntries = (paneEntries, layerTree, getAllChildLayerIds) => {
    const activeLayerIds = [];
    const hiddenLayerIds = [];
    const layerOpacities = new Map();
    const filters = {};

    paneEntries.forEach((entry) => {
        const layerId = resolveRefToId(entry.slug, layerTree);
        if (!layerId) return;
        if (!activeLayerIds.includes(layerId)) {
            activeLayerIds.push(layerId);
            getAllChildLayerIds(layerId).forEach((childId) => {
                if (!activeLayerIds.includes(childId)) activeLayerIds.push(childId);
            });
        }
        if (entry.visible === false) hiddenLayerIds.push(layerId);
        if (typeof entry.opacity === 'number') layerOpacities.set(layerId, entry.opacity);

        const layerFilters = {};
        Object.entries(entry.filters || {}).forEach(([name, cql]) => {
            if (cql) layerFilters[name] = cql;
        });
        if (Object.keys(layerFilters).length > 0) {
            filters[layerId] = layerFilters;
        }
    });

    return { activeLayerIds, hiddenLayerIds, layerOpacities, filters };
};

export const useShareDeserializer = () => {
    const {
        setActiveLayerIds,
        getAllChildLayerIds,
        applyFilter,
        setSelectedLayerForSymbology,
        findLayerById,
        setLayerOpacity,
        setHiddenLayerIds,
        setLayerOpacities,
        setFilters,
        setBaseMapId,
        mapRef,
        setCompareMode,
        restoreAnnotations,
    } = useMapsContext();
    const { layers: layerTree } = useLayers();

    return useCallback((envelope) => {
        if (!envelope || envelope.version !== 1) return false;
        if (envelope.kind !== 'single' && envelope.kind !== 'swipe') return false;
        const isSwipe = envelope.kind === 'swipe';

        if (isSwipe) {
            const payload = envelope.payload || {};
            const shared = payload.shared || {};
            const paneAEntries = Array.isArray(payload.paneA?.layers) ? payload.paneA.layers : [];
            const paneBEntries = Array.isArray(payload.paneB?.layers) ? payload.paneB.layers : [];
            const paneA = {
                ...buildPaneFromEntries(paneAEntries, layerTree, getAllChildLayerIds),
                label: payload.paneA?.label || 'A',
            };
            const paneB = {
                ...buildPaneFromEntries(paneBEntries, layerTree, getAllChildLayerIds),
                label: payload.paneB?.label || 'B',
            };
            const activeSlot = payload.activeSlot === 'B' ? 'B' : 'A';
            const livePane = activeSlot === 'A' ? paneA : paneB;

            setActiveLayerIds(livePane.activeLayerIds);
            if (typeof setHiddenLayerIds === 'function') setHiddenLayerIds(livePane.hiddenLayerIds);
            if (typeof setLayerOpacities === 'function') {
                setLayerOpacities(new Map(livePane.layerOpacities));
            } else if (typeof setLayerOpacity === 'function') {
                livePane.layerOpacities.forEach((op, id) => setLayerOpacity(id, op));
            }
            if (typeof setFilters === 'function') {
                setFilters(structuredClone(livePane.filters));
            } else {
                Object.entries(livePane.filters).forEach(([layerId, layerFilters]) => {
                    Object.entries(layerFilters).forEach(([name, cql]) => applyFilter(layerId, name, cql));
                });
            }

            if (shared.basemap && typeof setBaseMapId === 'function') setBaseMapId(shared.basemap);
            if (shared.view && mapRef?.current) {
                const olView = mapRef.current.getView();
                if (typeof shared.view.lon === 'number' && typeof shared.view.lat === 'number') {
                    olView.setCenter(fromLonLat([shared.view.lon, shared.view.lat]));
                }
                if (typeof shared.view.zoom === 'number') olView.setZoom(shared.view.zoom);
                if (typeof shared.view.rotation === 'number') olView.setRotation(shared.view.rotation);
            }
            if (shared.selected) {
                const selectedId = resolveRefToId(shared.selected, layerTree);
                if (selectedId) {
                    const selectedLayer = findLayerById(selectedId);
                    if (selectedLayer) setSelectedLayerForSymbology(selectedLayer);
                }
            }

            const swipePosition = typeof payload.position === 'number' ? payload.position : 0.5;
            if (typeof setCompareMode === 'function') {
                const stillActiveIds = new Set([
                    ...paneA.activeLayerIds,
                    ...paneB.activeLayerIds,
                ]);
                const globalOrder = [
                    ...paneA.activeLayerIds,
                    ...paneB.activeLayerIds.filter(id => !paneA.activeLayerIds.includes(id)),
                ].filter(id => stillActiveIds.has(id));
                setCompareMode({
                    ...initialCompareMode(),
                    active: true,
                    activeSlot,
                    paneA,
                    paneB,
                    swipePosition,
                    globalOrder,
                });
            }
            if (Array.isArray(payload.annotations) && typeof restoreAnnotations === 'function') {
                restoreAnnotations(payload.annotations);
            }
            return true;
        }

        const payload = envelope.payload || {};
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

        if (typeof setCompareMode === 'function') {
            setCompareMode(initialCompareMode());
        }

        if (Array.isArray(payload.annotations) && typeof restoreAnnotations === 'function') {
            restoreAnnotations(payload.annotations);
        }

        return true;
    }, [setActiveLayerIds, getAllChildLayerIds, applyFilter, setSelectedLayerForSymbology, findLayerById, setLayerOpacity, setLayerOpacities, setFilters, setHiddenLayerIds, setBaseMapId, mapRef, layerTree, setCompareMode, restoreAnnotations]);
};
