import { useCallback, useRef, useState } from 'react';
import { fromLonLat } from 'ol/proj';
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';
import { ACTIVE_LAYERS_PANEL_WIDTH, getFitPadding } from '@pages/maps/helpers/mapFit';

const REGRESO_MS = 1200;

const movimientoReducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const useFunFactDestino = () => {
    const { mapRef, paneMapInstances } = useMapsContext();
    const { width: siderWidth, isMobile } = useSider();
    const [pin, setPin] = useState(null);
    const anteriorRef = useRef(null);
    const viajeRef = useRef(0);

    const mapaActivo = useCallback(() => paneMapInstances?.[0] || mapRef?.current || null, [mapRef, paneMapInstances]);

    const viajar = useCallback((destino, texto, duracion) => {
        const map = mapaActivo();
        const size = map?.getSize();
        const target = map?.getTargetElement();
        if (!size || !target) return null;

        const view = map.getView();
        const [top, right, bottom, left] = getFitPadding({ mapSize: size, siderWidth, isMobile, rightPanelWidth: ACTIVE_LAYERS_PANEL_WIDTH });
        const px = left + (size[0] - left - right) / 2;
        const py = top + (size[1] - top - bottom) / 2;
        const resolucion = view.getResolutionForZoom(destino.zoom);
        const [x, y] = fromLonLat([destino.lon, destino.lat]);
        const centro = [x - (px - size[0] / 2) * resolucion, y + (py - size[1] / 2) * resolucion];

        if (!anteriorRef.current) anteriorRef.current = { center: view.getCenter(), zoom: view.getZoom() };
        viajeRef.current += 1;
        const viaje = viajeRef.current;
        setPin(null);
        view.cancelAnimations();

        const llegar = () => {
            if (viajeRef.current === viaje) setPin({ id: viaje, lon: destino.lon, lat: destino.lat, texto });
        };

        if (duracion <= 0) {
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
    }, [mapaActivo, siderWidth, isMobile]);

    const cerrar = useCallback(() => {
        viajeRef.current += 1;
        anteriorRef.current = null;
        setPin(null);
    }, []);

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
