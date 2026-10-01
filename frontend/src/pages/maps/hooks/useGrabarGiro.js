import { useCallback, useRef, useState } from 'react';
import { fromLonLat, transformExtent } from 'ol/proj';
import { useView3d } from '@contexts/View3dContext';
import { useMapsContext } from '@hooks/useMaps';
import { basemapTileUrl } from '@pages/maps/helpers/view3d';
import { ZOOM_MINIMAPA_RANGO } from '@pages/maps/helpers/dron/minimapaDron';
import { precargarTeselas } from '@pages/maps/helpers/dron/dibujoMinimapa';
import { triggerDownload } from '@services/downloadService';
import { trackView3d } from '@services/analyticsService';
import { crearCodificador } from '@pages/maps/helpers/grabacion/codificador';
import { cargarRecursos, componerCuadro } from '@pages/maps/helpers/grabacion/composicion';
import { indicadoresDeGiro, nombreDeArchivo, planDeGiro, rumboDelCuadro } from '@pages/maps/helpers/grabacion/planGiro';
import { esperarMapa3d } from '@pages/maps/helpers/grabacion/esperar3d';

const ESPERA_MS = 2500;
const SIN_VIDEO = 'Tu navegador no puede grabar video. Prueba con GIF o con Chrome.';

const esperarMapa = map => new Promise((resolver) => {
    const limite = setTimeout(resolver, ESPERA_MS);
    map.once('idle', () => {
        clearTimeout(limite);
        resolver();
    });
    map.triggerRepaint();
});

export const ubicacionDe = (map) => {
    const centro = map.getCenter();
    const limites = map.getBounds();
    return {
        centro: fromLonLat([centro.lng, centro.lat]),
        zoom: map.getZoom() + 1,
        extension: transformExtent([limites.getWest(), limites.getSouth(), limites.getEast(), limites.getNorth()], 'EPSG:4326', 'EPSG:3857'),
    };
};

const ALEJAR_MINIMAPA = 2;

export const teselasDe = (map, plantilla, cache) => {
    const centro = map.getCenter();
    const [minimo, maximo] = ZOOM_MINIMAPA_RANGO;
    return {
        centro: [centro.lng, centro.lat],
        zoom: Math.max(minimo, Math.min(maximo, Math.round(map.getZoom() + 1 - ALEJAR_MINIMAPA))),
        rumbo: map.getBearing(),
        plantilla,
        cache,
    };
};

export const useGrabarGiro = () => {
    const { map3dRef, setOrbita, velocidadOrbita, active, enter } = useView3d();
    const { basemaps, baseMapId } = useMapsContext();
    const plantilla = basemapTileUrl(basemaps?.[baseMapId]?.tiles);
    const cacheRef = useRef(new Map());
    const [progreso, setProgreso] = useState(null);
    const [error, setError] = useState(null);
    const cancelarRef = useRef(false);
    const enCursoRef = useRef(false);

    const grabar = useCallback(async ({ tipo, segundosGif, calidad, titulo, totalCapas }) => {
        if (enCursoRef.current) return;
        enCursoRef.current = true;
        cancelarRef.current = false;
        setError(null);
        setProgreso(0);
        if (!active) enter();
        let map;
        try {
            map = await esperarMapa3d(map3dRef);
        } catch (fallo) {
            setError(fallo.message);
            enCursoRef.current = false;
            setProgreso(null);
            return;
        }
        setOrbita(false);
        const plan = planDeGiro({ tipo, segundosGif, calidad, velocidad: velocidadOrbita });
        const lienzo = document.createElement('canvas');
        lienzo.width = plan.ancho;
        lienzo.height = plan.alto;
        const ctx = lienzo.getContext('2d', { willReadFrequently: tipo === 'gif' });
        const inicio = map.getBearing();
        let codificador = null;
        try {
            const [recursos, creado] = await Promise.all([cargarRecursos(), crearCodificador(tipo, lienzo, plan.fps)]);
            codificador = creado;
            if (!codificador) throw new Error(SIN_VIDEO);
            const lado = Math.round(Math.max(plan.ancho, plan.alto) * 0.26);
            await precargarTeselas({ ...teselasDe(map, plantilla, cacheRef.current), ancho: lado, alto: lado });
            for (let i = 0; i < plan.cuadros && !cancelarRef.current; i += 1) {
                const rumbo = rumboDelCuadro(inicio, i, plan.cuadros);
                map.jumpTo({ bearing: rumbo });
                await esperarMapa(map);
                const ubicacion = { ...ubicacionDe(map), teselas: teselasDe(map, plantilla, cacheRef.current) };
                componerCuadro(ctx, {
                    ancho: plan.ancho,
                    alto: plan.alto,
                    mapa: map.getCanvas(),
                    recursos,
                    rumbo,
                    ubicacion,
                    titulo,
                    totalCapas,
                    compacto: tipo === 'gif',
                    indicadores: indicadoresDeGiro({ rumbo, inclinacion: map.getPitch(), zoom: ubicacion.zoom }),
                });
                await codificador.agregar(i / plan.fps);
                setProgreso((i + 1) / plan.cuadros);
            }
            if (cancelarRef.current) {
                codificador.cancelar();
                return;
            }
            const archivo = await codificador.terminar();
            triggerDownload(archivo, `${nombreDeArchivo(titulo)}${codificador.extension}`);
            trackView3d('grabar_giro', { formato: tipo, segundos: plan.segundos, cuadros: plan.cuadros });
        } catch (fallo) {
            codificador?.cancelar();
            setError(fallo?.message || 'No se pudo grabar la vuelta.');
        } finally {
            map.jumpTo({ bearing: inicio });
            enCursoRef.current = false;
            setProgreso(null);
        }
    }, [map3dRef, setOrbita, velocidadOrbita, active, enter, plantilla]);

    const cancelar = useCallback(() => { cancelarRef.current = true; }, []);

    return { grabando: progreso !== null, progreso, error, grabar, cancelar };
};
