import { useCallback, useEffect, useRef, useState } from 'react';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { boundingExtent } from 'ol/extent';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';
import { ACTIVE_LAYERS_PANEL_WIDTH, getFitPadding } from '@pages/maps/helpers/mapFit';
import { verticesDeDestino } from '@pages/maps/helpers/eventoFunRuta';

const REGRESO_MS = 1200;
const RUTA_Z_INDEX = 950;
const GUION = [10, 8];

const estiloRuta = (desplazamiento) => [
    new Style({ stroke: new Stroke({ color: 'rgba(255,255,255,0.85)', width: 6 }) }),
    new Style({ stroke: new Stroke({ color: '#FF8300', width: 2.5, lineDash: GUION, lineDashOffset: -desplazamiento }) }),
];

const estiloVertice = new Style({
    image: new CircleStyle({
        radius: 4.5,
        fill: new Fill({ color: '#FF8300' }),
        stroke: new Stroke({ color: '#FFFFFF', width: 2 }),
    }),
});

const movimientoReducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const useFunFactDestino = () => {
    const { mapRef, paneMapInstances } = useMapsContext();
    const { width: siderWidth, isMobile } = useSider();
    const [pin, setPin] = useState(null);
    const anteriorRef = useRef(null);
    const viajeRef = useRef(0);
    const capaRef = useRef(null);
    const marchaRef = useRef(null);

    const mapaActivo = useCallback(() => paneMapInstances?.[0] || mapRef?.current || null, [mapRef, paneMapInstances]);

    const quitarRuta = useCallback(() => {
        if (marchaRef.current) cancelAnimationFrame(marchaRef.current);
        marchaRef.current = null;
        const map = mapaActivo();
        if (capaRef.current && map) map.removeLayer(capaRef.current);
        capaRef.current = null;
    }, [mapaActivo]);

    const dibujarRuta = useCallback((coordenadas) => {
        const map = mapaActivo();
        if (!map) return;
        quitarRuta();
        const linea = new Feature(new LineString(coordenadas));
        linea.setStyle(estiloRuta(0));
        const vertices = coordenadas.map((c) => {
            const punto = new Feature(new Point(c));
            punto.setStyle(estiloVertice);
            return punto;
        });
        const capa = new VectorLayer({
            source: new VectorSource({ features: [linea, ...vertices] }),
            zIndex: RUTA_Z_INDEX,
        });
        map.addLayer(capa);
        capaRef.current = capa;
        if (movimientoReducido()) return;
        let desplazamiento = 0;
        const marchar = () => {
            desplazamiento = (desplazamiento + 0.55) % (GUION[0] + GUION[1]);
            linea.setStyle(estiloRuta(desplazamiento));
            marchaRef.current = requestAnimationFrame(marchar);
        };
        marchaRef.current = requestAnimationFrame(marchar);
    }, [mapaActivo, quitarRuta]);

    const viajar = useCallback((destino, texto, duracion, eventoId = null) => {
        const map = mapaActivo();
        const size = map?.getSize();
        const target = map?.getTargetElement();
        const vertices = verticesDeDestino(destino);
        if (!size || !target || vertices.length === 0) return null;

        const view = map.getView();
        const [top, right, bottom, left] = getFitPadding({ mapSize: size, siderWidth, isMobile, rightPanelWidth: ACTIVE_LAYERS_PANEL_WIDTH });
        const px = left + (size[0] - left - right) / 2;
        const py = top + (size[1] - top - bottom) / 2;
        const coordenadas = vertices.map((v) => fromLonLat(v));
        const resolucion = view.getResolutionForZoom(destino.zoom);
        const [x, y] = coordenadas[coordenadas.length - 1];
        const centro = [x - (px - size[0] / 2) * resolucion, y + (py - size[1] / 2) * resolucion];

        if (!anteriorRef.current) anteriorRef.current = { center: view.getCenter(), zoom: view.getZoom() };
        viajeRef.current += 1;
        const viaje = viajeRef.current;
        setPin(null);
        view.cancelAnimations();
        if (coordenadas.length > 1) dibujarRuta(coordenadas);
        else quitarRuta();

        const llegar = () => {
            if (viajeRef.current === viaje) setPin({ id: viaje, lon: destino.lon, lat: destino.lat, texto, eventoId });
        };

        if (coordenadas.length > 1) {
            view.fit(boundingExtent(coordenadas), {
                padding: [top, right, bottom, left],
                maxZoom: destino.zoom,
                duration: Math.max(0, duracion),
                callback: llegar,
            });
        } else if (duracion <= 0) {
            view.setCenter(centro);
            view.setZoom(destino.zoom);
            llegar();
        } else {
            let pendientes = 2;
            const alTerminar = () => {
                pendientes -= 1;
                if (pendientes === 0) llegar();
            };
            const alto = Math.min(view.getZoom(), destino.zoom) - 1;
            view.animate({ center: centro, duration: duracion }, alTerminar);
            view.animate({ zoom: alto, duration: duracion * 0.35 }, { zoom: destino.zoom, duration: duracion * 0.65 }, alTerminar);
        }

        const rect = target.getBoundingClientRect();
        return { x: rect.left + px, y: rect.top + py };
    }, [mapaActivo, siderWidth, isMobile, dibujarRuta, quitarRuta]);

    const cerrar = useCallback(() => {
        viajeRef.current += 1;
        anteriorRef.current = null;
        quitarRuta();
        setPin(null);
    }, [quitarRuta]);

    useEffect(() => () => quitarRuta(), [quitarRuta]);

    const volver = useCallback(() => {
        const map = mapaActivo();
        const anterior = anteriorRef.current;
        cerrar();
        if (!map || !anterior) return;
        const view = map.getView();
        view.cancelAnimations();
        view.animate({ ...anterior, duration: movimientoReducido() ? 0 : REGRESO_MS });
    }, [mapaActivo, cerrar]);

    return { pin, viajar, volver, cerrar };
};
