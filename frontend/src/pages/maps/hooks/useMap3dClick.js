import { useEffect } from 'react';
import { fromLonLat } from 'ol/proj';

const extrusionLayerIds = (map) => (map.getStyle()?.layers || [])
    .filter(layer => layer.type === 'fill-extrusion')
    .map(layer => layer.id);

export const useMap3dClick = (map, olMapRef, pausado, consultar) => {
    useEffect(() => {
        if (!map) return undefined;

        const onClick = (event) => {
            const olMap = olMapRef.current;
            if (!olMap || pausado) return;
            consultar(olMap, fromLonLat(event.lngLat.toArray()), event);
        };
        const onMove = (event) => {
            if (pausado) return;
            const layers = extrusionLayerIds(map);
            const hit = layers.length && map.queryRenderedFeatures(event.point, { layers }).length > 0;
            map.getCanvas().style.cursor = hit ? 'pointer' : '';
        };

        map.on('click', onClick);
        map.on('mousemove', onMove);
        return () => {
            map.off('click', onClick);
            map.off('mousemove', onMove);
        };
    }, [map, olMapRef, consultar, pausado]);
};
