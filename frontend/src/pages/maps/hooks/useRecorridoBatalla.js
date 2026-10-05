import { useCallback, useEffect, useRef, useState } from 'react';
import { useView3d } from '@contexts/View3dContext';
import { extentDeRuta, longitudDeRuta, puntoEnRuta, rumboEntre } from '@pages/maps/helpers/eventoFunRuta';

const PITCH = 68;
const ZOOM = 13.2;
const METROS_POR_SEGUNDO = 4200;
const DURACION_MIN_MS = 6000;
const DURACION_MAX_MS = 18000;
const ESPERA_MAPA_MS = 6000;
const ACOMODO_MS = 420;
const ENCUADRE_MS = 1600;
const RELLENO_PX = 72;

const movimientoReducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));

export const useRecorridoBatalla = () => {
    const { available, active, enter, map3dRef, pitch, setPitch, bearing, setBearing } = useView3d();
    const [recorriendo, setRecorriendo] = useState(false);
    const cuadroRef = useRef(null);
    const canceladoRef = useRef(false);

    const detener = useCallback(() => {
        canceladoRef.current = true;
        if (cuadroRef.current) cancelAnimationFrame(cuadroRef.current);
        cuadroRef.current = null;
        setRecorriendo(false);
    }, []);

    useEffect(() => () => detener(), [detener]);

    const esperarMapa = useCallback(() => new Promise((listo) => {
        const desde = performance.now();
        const mirar = () => {
            if (map3dRef?.current) { listo(map3dRef.current); return; }
            if (performance.now() - desde > ESPERA_MAPA_MS) { listo(null); return; }
            requestAnimationFrame(mirar);
        };
        mirar();
    }), [map3dRef]);

    const recorrer = useCallback(async (vertices) => {
        if (!available || !Array.isArray(vertices) || vertices.length < 2) return false;
        detener();
        canceladoRef.current = false;
        if (!active) enter();
        const map = await esperarMapa();
        if (!map || canceladoRef.current) return false;

        const extent = extentDeRuta(vertices);
        const limites = [[extent[0], extent[1]], [extent[2], extent[3]]];
        const rumbo = rumboEntre(vertices[0], vertices[vertices.length - 1]);
        const sinMovimiento = movimientoReducido();

        if (sinMovimiento) {
            map.fitBounds(limites, { padding: RELLENO_PX, pitch, bearing, duration: 0 });
            return true;
        }

        setRecorriendo(true);
        setPitch?.(PITCH);
        setBearing?.(rumbo);
        await esperar(ACOMODO_MS);
        if (canceladoRef.current) return false;

        const duracion = Math.min(
            DURACION_MAX_MS,
            Math.max(DURACION_MIN_MS, (longitudDeRuta(vertices) / METROS_POR_SEGUNDO) * 1000),
        );
        const inicio = performance.now();

        const paso = (ahora) => {
            if (canceladoRef.current) return;
            const s = Math.min(1, (ahora - inicio) / duracion);
            map.jumpTo({ center: puntoEnRuta(vertices, s), zoom: ZOOM, pitch: PITCH, bearing: rumbo });
            if (s < 1) {
                cuadroRef.current = requestAnimationFrame(paso);
                return;
            }
            cuadroRef.current = null;
            map.fitBounds(limites, { padding: RELLENO_PX, pitch: PITCH, bearing: rumbo, duration: ENCUADRE_MS });
            setRecorriendo(false);
        };

        cuadroRef.current = requestAnimationFrame(paso);
        return true;
    }, [available, active, enter, esperarMapa, detener, pitch, bearing, setPitch, setBearing]);

    return { disponible: Boolean(available), recorriendo, recorrer, detener };
};
