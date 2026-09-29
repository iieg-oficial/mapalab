import { useEffect, useRef } from 'react';
import { useView3d } from '@contexts/View3dContext';
import { loadMaplibre } from '@pages/maps/helpers/maplibreLoader';

export const NIVEL_MAXIMO = 300;
const SUBIDA_POR_SEGUNDO = 6;

export const useMap3dInundacion = (map, principal) => {
    const { inundacion, setInundacion, exaggeration } = useView3d();
    const { nivel, lloviendo, referencia } = inundacion;
    const activa = principal && !!map && (nivel > 0 || lloviendo);
    const vivo = useRef({});
    vivo.current = { nivel, referencia, exaggeration, centro: inundacion.centro };

    useEffect(() => {
        if (!activa || referencia !== null) return;
        const centro = map.getCenter();
        setInundacion({ referencia: (map.queryTerrainElevation(centro) ?? 0) / (exaggeration || 1), centro: centro.toArray() });
    }, [activa, referencia, map, exaggeration, setInundacion]);

    useEffect(() => {
        if (!activa) return undefined;
        let capa = null;
        let cancelado = false;
        const leer = () => {
            const actual = vivo.current;
            if (actual.referencia === null) return { centro: null, altura: null };
            return { centro: actual.centro, altura: (actual.referencia + actual.nivel) * (actual.exaggeration || 1) };
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
        if (!lloviendo || !principal) return undefined;
        let cuadro = null;
        let anterior = performance.now();
        let acumulado = vivo.current.nivel;
        let ultimoAviso = 0;
        const llover = (ahora) => {
            acumulado = Math.min(NIVEL_MAXIMO, acumulado + ((ahora - anterior) / 1000) * SUBIDA_POR_SEGUNDO);
            anterior = ahora;
            if (ahora - ultimoAviso > 120 || acumulado >= NIVEL_MAXIMO) {
                ultimoAviso = ahora;
                setInundacion(acumulado >= NIVEL_MAXIMO ? { nivel: NIVEL_MAXIMO, lloviendo: false } : { nivel: acumulado });
            }
            if (acumulado < NIVEL_MAXIMO) cuadro = requestAnimationFrame(llover);
        };
        cuadro = requestAnimationFrame(llover);
        return () => cancelAnimationFrame(cuadro);
    }, [lloviendo, principal, setInundacion]);
};
