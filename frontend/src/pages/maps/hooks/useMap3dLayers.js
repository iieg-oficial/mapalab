import { useEffect } from 'react';
import { unByKey } from 'ol/Observable';
import { getUid } from 'ol/util';
import { RELIEF_LAYER_ID, wmsTileUrl } from '@pages/maps/helpers/view3d';

const PREFIX = 'wms-';

const subLayerIds = (layer) => (layer.get('mergedLayers') || []).flatMap(entry => (entry.subLayers || []).map(sub => sub.id));

const cubiertaPorOtraVista = (layer, excluidos) => {
    const ids = subLayerIds(layer);
    return ids.length > 0 && ids.every(id => excluidos.has(id));
};

const isMirrored = (layer, excluidos) => !!layer.get('mergedLayers') && layer.getVisible() && !cubiertaPorOtraVista(layer, excluidos);

const byZIndex = (a, b) => (a.getZIndex() ?? 0) - (b.getZIndex() ?? 0);

const readOlLayers = (olMap, excluidos) => olMap.getLayers().getArray().filter(layer => isMirrored(layer, excluidos)).sort(byZIndex);

const mirroredIds = (map) => (map.getStyle()?.layers || []).map(layer => layer.id).filter(id => id.startsWith(PREFIX));

const sourceUrl = (source) => (source.getUrl ? source.getUrl() : source.getUrls?.()?.[0]) || null;

const upsert = (map, id, layer) => {
    const source = layer.getSource();
    const url = wmsTileUrl(sourceUrl(source), source.getParams());
    if (!url) return;
    const existing = map.getSource(id);
    if (!existing) {
        map.addSource(id, { type: 'raster', tiles: [url], tileSize: 256 });
        map.addLayer({
            id,
            type: 'raster',
            source: id,
            paint: { 'raster-opacity': layer.getOpacity(), 'raster-fade-duration': 0 },
        }, map.getLayer(RELIEF_LAYER_ID) ? RELIEF_LAYER_ID : undefined);
        return;
    }
    if (existing.tiles?.[0] !== url) existing.setTiles([url]);
    map.setPaintProperty(id, 'raster-opacity', layer.getOpacity());
};

const SIN_EXCLUIDOS = new Set();

export const syncWmsLayers = (map, olMap, excluidos = SIN_EXCLUIDOS) => {
    const olLayers = readOlLayers(olMap, excluidos);
    const wanted = new Map(olLayers.map(layer => [`${PREFIX}${getUid(layer)}`, layer]));

    mirroredIds(map).forEach((id) => {
        if (wanted.has(id)) return;
        map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
    });

    wanted.forEach((layer, id) => upsert(map, id, layer));

    const before = map.getLayer(RELIEF_LAYER_ID) ? RELIEF_LAYER_ID : undefined;
    wanted.forEach((_, id) => map.moveLayer(id, before));
};

export const useMap3dLayers = (map, olMapRef, excluidos = SIN_EXCLUIDOS) => {
    useEffect(() => {
        const olMap = olMapRef.current;
        if (!map || !olMap) return undefined;

        let frame = null;
        let layerKeys = [];
        const schedule = () => {
            if (frame !== null) return;
            frame = requestAnimationFrame(() => {
                frame = null;
                watchLayers();
                syncWmsLayers(map, olMap, excluidos);
            });
        };
        const watchLayers = () => {
            unByKey(layerKeys);
            layerKeys = olMap.getLayers().getArray()
                .filter(layer => layer.get('mergedLayers'))
                .flatMap(layer => [
                    layer.on(['change:opacity', 'change:visible', 'change:zIndex'], schedule),
                    layer.getSource().on('change', schedule),
                ]);
        };

        const collectionKeys = olMap.getLayers().on(['add', 'remove'], schedule);
        watchLayers();
        syncWmsLayers(map, olMap, excluidos);

        return () => {
            if (frame !== null) cancelAnimationFrame(frame);
            unByKey(collectionKeys);
            unByKey(layerKeys);
        };
    }, [map, olMapRef, excluidos]);
};
