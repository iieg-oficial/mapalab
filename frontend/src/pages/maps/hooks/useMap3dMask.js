import { useEffect } from 'react';
import { loadJaliscoMask } from '@pages/maps/helpers/jaliscoMask';
import { RELIEF_LAYER_ID } from '@pages/maps/helpers/view3d';

const SOURCE_ID = 'jalisco';
const MASK_LAYER = 'jalisco-mascara';
const OUTLINE_LAYER = 'jalisco-contorno';

const MASK_COLOR = '#EDEAE4';
const OUTLINE_COLOR = '#FFFFFF';

export const useMap3dMask = (map) => {
    useEffect(() => {
        if (!map) return undefined;
        let cancelled = false;

        loadJaliscoMask().then((data) => {
            if (cancelled || !data || map.getSource(SOURCE_ID)) return;
            map.addSource(SOURCE_ID, { type: 'geojson', data });
            const beforeMask = map.getLayer(RELIEF_LAYER_ID) ? RELIEF_LAYER_ID : undefined;
            map.addLayer({
                id: MASK_LAYER,
                type: 'fill',
                source: SOURCE_ID,
                filter: ['==', ['get', 'rol'], 'mascara'],
                paint: { 'fill-color': MASK_COLOR, 'fill-opacity': 1 },
            }, beforeMask);
            map.addLayer({
                id: OUTLINE_LAYER,
                type: 'line',
                source: SOURCE_ID,
                filter: ['==', ['get', 'rol'], 'contorno'],
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': OUTLINE_COLOR, 'line-width': 3, 'line-opacity': 1 },
            });
        }).catch((error) => {
            console.warn('[mapa3d] sin limite estatal para el contorno', error?.message || error);
        });

        return () => { cancelled = true; };
    }, [map]);
};
