import { useEffect, useRef } from 'react';
import { useView3d } from '@contexts/View3dContext';
import { loadMaplibre } from '@pages/maps/helpers/maplibreLoader';
import { INTENSIDADES, INTENSIDAD_DEFAULT, dentroDe, elevacionMinima, extensionDe } from '@pages/maps/helpers/inundacion';
import { JALISCO_BOUNDS } from '@pages/maps/helpers/wmsConfig';

const JALISCO = extensionDe(JALISCO_BOUNDS.coords);

const MUESTRAS = 14;

const referenciaVisible = (map) => {
    const lienzo = map.getCanvas();
    const [ancho, alto] = [lienzo.clientWidth, lienzo.clientHeight];
    const alturas = [];
    for (let i = 0; i < MUESTRAS; i += 1) {
        for (let j = 0; j < MUESTRAS; j += 1) {
            const punto = map.unproject([(ancho * (i + 0.5)) / MUESTRAS, alto * (0.35 + (0.65 * (j + 0.5)) / MUESTRAS)]);
            if (dentroDe(JALISCO_BOUNDS.coords, punto.toArray())) alturas.push(map.queryTerrainElevation(punto));
        }
    }
    return elevacionMinima(alturas);
};

export const useMap3dInundacion = (map, principal) => {
    const { inundacion, setInundacion, exaggeration } = useView3d();
    const { nivel, lloviendo, referencia, intensidad = INTENSIDAD_DEFAULT, modo = 'general', punto, radio, eligiendo } = inundacion;
    const local = modo === 'local';
    const activa = principal && !!map && (nivel > 0 || lloviendo) && (!local || !!punto);
    const vivo = useRef({});
    vivo.current = { nivel, referencia, exaggeration, centro: inundacion.centro, lloviendo, intensidad, local, radio };

    useEffect(() => {
        if (!activa || referencia !== null) return undefined;
        let espera = null;
        const intentar = () => {
            const base = local ? map.queryTerrainElevation(punto) : referenciaVisible(map);
            const minima = map.getTerrain() ? base : 0;
            if (minima === null || minima === undefined) {
                espera = setTimeout(intentar, 300);
                return;
            }
            setInundacion({ referencia: minima / (exaggeration || 1), centro: local ? punto : JALISCO.centro });
        };
        intentar();
        return () => clearTimeout(espera);
    }, [activa, referencia, map, exaggeration, setInundacion, local, punto]);

    useEffect(() => {
        if (!eligiendo || !map || !principal) return undefined;
        const lienzo = map.getCanvas();
        const cursor = lienzo.style.cursor;
        lienzo.style.cursor = 'crosshair';
        const elegir = e => setInundacion({ punto: e.lngLat.toArray(), eligiendo: false, referencia: null, centro: null });
        map.once('click', elegir);
        return () => {
            map.off('click', elegir);
            lienzo.style.cursor = cursor;
        };
    }, [eligiendo, map, principal, setInundacion]);

    useEffect(() => {
        if (!activa) return undefined;
        let capa = null;
        let cancelado = false;
        const leer = () => {
            const actual = vivo.current;
            const lluvia = { activa: actual.lloviendo, densidad: (INTENSIDADES[actual.intensidad] || INTENSIDADES[INTENSIDAD_DEFAULT]).gotas };
            if (actual.referencia === null) return { centro: null, altura: null, lluvia };
            return { centro: actual.centro, altura: (actual.referencia + actual.nivel) * (actual.exaggeration || 1), lluvia, radio: actual.local ? actual.radio : null, extension: [JALISCO.ancho, JALISCO.alto] };
        };
        Promise.all([loadMaplibre(), import('@pages/maps/helpers/capaInundacion')]).then(([maplibregl, { crearCapaInundacion }]) => {
            if (cancelado) return;
            capa = crearCapaInundacion(maplibregl, { leer });
            map.addLayer(capa);
        }).catch(error => console.error('[mapa3d] no se pudo cargar la inundación', error));
        return () => {
            cancelado = true;
            try {
                if (capa && map.getLayer(capa.id)) map.removeLayer(capa.id);
            } catch {
                return;
            }
        };
    }, [activa, map]);

    useEffect(() => {
        if (activa) map.triggerRepaint();
    }, [activa, map, nivel, referencia, radio, local]);

    useEffect(() => {
        if (!lloviendo || !principal) return undefined;
        let cuadro = null;
        let anterior = performance.now();
        let acumulado = vivo.current.nivel;
        let ultimoAviso = 0;
        const { subida, tope } = INTENSIDADES[intensidad] || INTENSIDADES[INTENSIDAD_DEFAULT];
        const limite = Math.max(tope, acumulado);
        const llover = (ahora) => {
            acumulado = Math.min(limite, acumulado + ((ahora - anterior) / 1000) * subida);
            anterior = ahora;
            if (ahora - ultimoAviso > 120 || acumulado >= limite) {
                ultimoAviso = ahora;
                setInundacion(acumulado >= limite ? { nivel: limite, lloviendo: false } : { nivel: acumulado });
            }
            if (acumulado < limite) cuadro = requestAnimationFrame(llover);
        };
        cuadro = requestAnimationFrame(llover);
        return () => cancelAnimationFrame(cuadro);
    }, [lloviendo, principal, intensidad, setInundacion]);
};
