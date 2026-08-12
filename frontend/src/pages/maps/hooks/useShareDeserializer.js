import { useCallback } from 'react';
import { fromLonLat } from 'ol/proj';
import { useMapsContext } from '@hooks/useMaps';
import { useLayers } from '@hooks/useLayers';
import { resolveRefToId } from '@pages/maps/helpers/wmsConfig';
import { initialCompareMode } from '@pages/maps/helpers/swipeMode';
import { VECTOR_SERVICE_ENABLED } from '@pages/maps/helpers/serviceMode';

const VIEW_RETRY_INTERVAL_MS = 100;
const VIEW_RETRY_MAX_ATTEMPTS = 60;

const scheduleViewApply = (mapRef, view) => {
    if (!view) return;
    const applyOnce = () => {
        const map = mapRef?.current;
        if (!map) return false;
        const olView = map.getView();
        if (typeof view.lon === 'number' && typeof view.lat === 'number') {
            olView.setCenter(fromLonLat([view.lon, view.lat]));
        }
        if (typeof view.zoom === 'number') olView.setZoom(view.zoom);
        if (typeof view.rotation === 'number') olView.setRotation(view.rotation);
        return true;
    };
    if (applyOnce()) return;
    let attempts = 0;
    const intervalId = setInterval(() => {
        attempts++;
        if (applyOnce() || attempts >= VIEW_RETRY_MAX_ATTEMPTS) {
            clearInterval(intervalId);
        }
    }, VIEW_RETRY_INTERVAL_MS);
};

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
        restoreSelectedById,
        findLayerById,
        setLayerOpacity,
        setServiceMode,
        setHiddenLayerIds,
        setLayerOpacities,
        setFilters,
        setBaseMapId,
        mapRef,
        setCompareMode,
        restoreAnnotations,
        municipioMode,
    } = useMapsContext();
    const { layers: layerTree } = useLayers();

    return useCallback((envelope) => {
        if (!envelope || (envelope.version !== 1 && envelope.version !== 2)) return false;
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

            if (typeof setServiceMode === 'function' && VECTOR_SERVICE_ENABLED) {
                [...paneAEntries, ...paneBEntries].forEach((entry) => {
                    if (!entry.service) return;
                    const layerId = resolveRefToId(entry.slug, layerTree);
                    if (layerId) setServiceMode(layerId, entry.service);
                });
            }

            if (shared.basemap && typeof setBaseMapId === 'function') setBaseMapId(shared.basemap);
            scheduleViewApply(mapRef, shared.view);
            if (shared.selected) {
                const selectedId = resolveRefToId(shared.selected, layerTree);
                if (selectedId) {
                    restoreSelectedById?.(selectedId);
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
                const capturedView = shared.view?.lat != null && shared.view?.lon != null && shared.view?.zoom != null
                    ? { center: fromLonLat([shared.view.lon, shared.view.lat]), zoom: shared.view.zoom }
                    : null;
                setCompareMode({
                    ...initialCompareMode(),
                    active: true,
                    activeSlot,
                    paneA,
                    paneB,
                    swipePosition,
                    globalOrder,
                    capturedView,
                });
            }
            if (Array.isArray(payload.annotations) && typeof restoreAnnotations === 'function') {
                restoreAnnotations(payload.annotations);
            }
            const sharedMunicipios = shared?.municipios;
            if (sharedMunicipios?.selected?.length > 0 && municipioMode?.enter) {
                municipioMode.enter(sharedMunicipios.selected, { fromUrl: true });
            }
            return true;
        }

        const payload = envelope.payload || {};
        const layers = Array.isArray(payload.layers) ? payload.layers : [];

        const resolvedIds = [];
        const hidden = [];
        const opacities = {};
        const services = [];

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
            if (entry.service) services.push([layerId, entry.service]);

            Object.entries(entry.filters || {}).forEach(([name, cql]) => {
                if (cql) applyFilter(layerId, name, cql);
            });
        });

        setActiveLayerIds(resolvedIds);
        if (typeof setHiddenLayerIds === 'function') setHiddenLayerIds(hidden);
        if (typeof setLayerOpacity === 'function') {
            Object.entries(opacities).forEach(([id, op]) => setLayerOpacity(id, op));
        }
        if (typeof setServiceMode === 'function' && VECTOR_SERVICE_ENABLED) {
            services.forEach(([id, mode]) => setServiceMode(id, mode));
        }

        if (payload.basemap && typeof setBaseMapId === 'function') {
            setBaseMapId(payload.basemap);
        }

        scheduleViewApply(mapRef, payload.view);

        if (payload.selected) {
            const selectedId = resolveRefToId(payload.selected, layerTree);
            if (selectedId) {
                restoreSelectedById?.(selectedId);
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

        const singleMunicipios = payload.municipios;
        if (singleMunicipios?.selected?.length > 0 && municipioMode?.enter) {
            municipioMode.enter(singleMunicipios.selected, { fromUrl: true });
        }

        return true;
    }, [setActiveLayerIds, getAllChildLayerIds, applyFilter, setSelectedLayerForSymbology, restoreSelectedById, findLayerById, setLayerOpacity, setServiceMode, setLayerOpacities, setFilters, setHiddenLayerIds, setBaseMapId, mapRef, layerTree, setCompareMode, restoreAnnotations, municipioMode]);
};
