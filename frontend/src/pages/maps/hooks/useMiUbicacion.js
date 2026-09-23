import { useCallback, useEffect, useRef } from 'react';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import { Fill, Stroke } from 'ol/style';
import { trackGeolocate } from '@services/analyticsService';

const FUENTE_3D = 'mi-ubicacion';
const NARANJA = '#f97316';

const capaOl = (coords) => {
    const feature = new Feature({ geometry: new Point(coords) });
    feature.setStyle(new Style({
        image: new Circle({ radius: 8, fill: new Fill({ color: NARANJA }), stroke: new Stroke({ color: '#ffffff', width: 3 }) }),
    }));
    return new VectorLayer({ source: new VectorSource({ features: [feature] }), zIndex: 1000 });
};

export const marcarEn3d = (map3d, lngLat) => {
    const data = { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: lngLat } };
    const fuente = map3d.getSource(FUENTE_3D);
    if (fuente) {
        fuente.setData(data);
        return;
    }
    map3d.addSource(FUENTE_3D, { type: 'geojson', data });
    map3d.addLayer({
        id: FUENTE_3D,
        type: 'circle',
        source: FUENTE_3D,
        paint: {
            'circle-radius': 8,
            'circle-color': NARANJA,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 3,
            'circle-pitch-alignment': 'viewport',
        },
    });
};

export const useMiUbicacion = ({ getActiveMap, get3d, isSwipe, mapRef, paneMapRefs, setIsLocating }) => {
    const capasRef = useRef([]);

    const quitarCapas = useCallback((mapas) => {
        capasRef.current.forEach(capa => mapas.forEach(m => m.removeLayer(capa)));
        capasRef.current = [];
    }, []);

    const ubicarme = useCallback(() => {
        const principal = getActiveMap();
        if (!principal || !navigator.geolocation) return;
        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lngLat = [position.coords.longitude, position.coords.latitude];
                const coords = fromLonLat(lngLat);
                const mapas = isSwipe
                    ? [paneMapRefs?.current?.[0]?.current, paneMapRefs?.current?.[1]?.current].filter(Boolean)
                    : [principal];

                quitarCapas(mapas);
                capasRef.current = mapas.map(() => capaOl(coords));
                mapas.forEach((m, i) => m.addLayer(capasRef.current[i]));

                const map3d = get3d();
                if (map3d) {
                    marcarEn3d(map3d, lngLat);
                    map3d.flyTo({ center: lngLat, zoom: 14, pitch: map3d.getPitch(), bearing: map3d.getBearing(), duration: 1500 });
                } else {
                    principal.getView().animate({ center: coords, zoom: 14, duration: 500 });
                }

                trackGeolocate('exito');
                setIsLocating(false);
            },
            (error) => {
                console.error('Error getting location:', error);
                trackGeolocate('error');
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
    }, [getActiveMap, get3d, isSwipe, paneMapRefs, setIsLocating, quitarCapas]);

    useEffect(() => {
        const mapa = mapRef.current;
        const panes = paneMapRefs;
        return () => quitarCapas([mapa, panes?.current?.[0]?.current, panes?.current?.[1]?.current].filter(Boolean));
    }, [mapRef, paneMapRefs, quitarCapas]);

    return ubicarme;
};
