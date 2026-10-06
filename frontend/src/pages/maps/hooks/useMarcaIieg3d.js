import { useEffect } from 'react';
import { loadMaplibre } from '@pages/maps/helpers/maplibreLoader';
import { buildIiegMarker } from '@pages/maps/helpers/markerDefinitions';
import { zoom3dDeOl } from '@pages/maps/helpers/view3d';

const ALTO_PX = 52;

export const useMarcaIieg3d = (map) => {
    useEffect(() => {
        if (!map) return undefined;
        const { center, icon, minZoom } = buildIiegMarker({ permanente: true });
        const desde = zoom3dDeOl(minZoom);
        let vigente = true;
        let marcador = null;
        const elemento = document.createElement('img');
        elemento.src = icon;
        elemento.alt = 'IIEG';
        elemento.style.height = `${ALTO_PX}px`;
        elemento.style.pointerEvents = 'none';
        const ajustar = () => { elemento.style.display = map.getZoom() >= desde ? 'block' : 'none'; };

        loadMaplibre().then((maplibregl) => {
            if (!vigente) return;
            marcador = new maplibregl.Marker({ element: elemento, anchor: 'bottom' }).setLngLat(center).addTo(map);
            ajustar();
            map.on('zoom', ajustar);
        }).catch(() => {});

        return () => {
            vigente = false;
            map.off('zoom', ajustar);
            marcador?.remove();
        };
    }, [map]);
};
