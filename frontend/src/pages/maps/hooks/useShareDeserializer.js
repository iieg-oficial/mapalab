import { useCallback } from 'react';
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
    } = useMapsContext();
    const { layers: layerTree } = useLayers();

    return useCallback((envelope) => {
        if (!envelope || envelope.version !== 1 || envelope.kind !== 'single') return false;
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

        if (payload.selected) {
            const selectedId = resolveRefToId(payload.selected, layerTree);
            if (selectedId) {
                const selectedLayer = findLayerById(selectedId);
                if (selectedLayer) setSelectedLayerForSymbology(selectedLayer);
            }
        }

        return true;
    }, [setActiveLayerIds, getAllChildLayerIds, applyFilter, setSelectedLayerForSymbology, findLayerById, setLayerOpacity, setHiddenLayerIds, setBaseMapId, layerTree]);
};
