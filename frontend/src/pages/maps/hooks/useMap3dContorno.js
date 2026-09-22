import { useEffect } from 'react';
import { loadLimiteEstatal } from '@pages/maps/helpers/limiteEstatal';

const SOURCE_ID = 'limite-estatal';
const OUTLINE_LAYER = 'limite-estatal-linea';

export const useMap3dContorno = (map) => {
    useEffect(() => {
        if (!map) return undefined;
        let cancelled = false;

        loadLimiteEstatal().then((data) => {
            if (cancelled || !data || map.getSource(SOURCE_ID)) return;
            map.addSource(SOURCE_ID, { type: 'geojson', data });
            map.addLayer({
                id: OUTLINE_LAYER,
                type: 'line',
                source: SOURCE_ID,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#FFFFFF', 'line-width': 3, 'line-opacity': 0.95 },
            });
        }).catch((error) => {
            console.warn('[mapa3d] sin limite estatal para el contorno', error?.message || error);
        });

        return () => { cancelled = true; };
    }, [map]);
};
