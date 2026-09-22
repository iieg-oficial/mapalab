import { useEffect } from 'react';
import { loadMaplibre } from '@pages/maps/helpers/maplibreLoader';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { EXTRUSION_PROPERTY_KEY } from '@pages/maps/helpers/map3dLayerSpecs';

const NAME_FIELDS = ['nombre', 'municipio', 'nom_mun', 'name', 'nombre_municipio'];

const humanize = (field) => (field === 'count' ? 'Elementos' : String(field).replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()));

const extrusionLayerIds = (map) => (map.getStyle()?.layers || [])
    .filter(layer => layer.type === 'fill-extrusion')
    .map(layer => layer.id);

const popupContent = (feature) => {
    const property = feature.layer?.metadata?.[EXTRUSION_PROPERTY_KEY];
    const props = feature.properties || {};
    const nameField = NAME_FIELDS.find(field => props[field]);
    const root = document.createElement('div');
    root.className = 'text-sm text-[#1A1A1A] leading-snug';
    if (nameField) {
        const title = document.createElement('p');
        title.className = 'font-medium';
        title.textContent = String(props[nameField]);
        root.appendChild(title);
    }
    if (property) {
        const value = Number(props[property]);
        const line = document.createElement('p');
        line.textContent = `${humanize(property)}: ${Number.isFinite(value) ? formatNumber(Math.round(value * 100) / 100) : 'Sin dato'}`;
        root.appendChild(line);
    }
    return root;
};

export const useMap3dPopup = (map) => {
    useEffect(() => {
        if (!map) return undefined;
        let popup = null;
        let cancelled = false;

        const onClick = async (event) => {
            const layers = extrusionLayerIds(map);
            if (!layers.length) return;
            const [feature] = map.queryRenderedFeatures(event.point, { layers });
            popup?.remove();
            if (!feature) return;
            const maplibregl = await loadMaplibre();
            if (cancelled) return;
            popup = new maplibregl.Popup({ closeButton: false, maxWidth: '260px' })
                .setLngLat(event.lngLat)
                .setDOMContent(popupContent(feature))
                .addTo(map);
        };
        const onMove = (event) => {
            const layers = extrusionLayerIds(map);
            const hit = layers.length && map.queryRenderedFeatures(event.point, { layers }).length > 0;
            map.getCanvas().style.cursor = hit ? 'pointer' : '';
        };

        map.on('click', onClick);
        map.on('mousemove', onMove);
        return () => {
            cancelled = true;
            popup?.remove();
            map.off('click', onClick);
            map.off('mousemove', onMove);
        };
    }, [map]);
};
