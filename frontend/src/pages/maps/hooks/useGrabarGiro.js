import { useCallback, useRef } from 'react';
import { fromLonLat, transformExtent } from 'ol/proj';
import { useView3d } from '@contexts/View3dContext';
import { triggerDownload } from '@services/downloadService';
import { trackView3d } from '@services/analyticsService';
import { crearCodificador } from '@pages/maps/helpers/grabacion/codificador';
import { cargarRecursos, componerCuadro } from '@pages/maps/helpers/grabacion/composicion';
import { nombreDeArchivo, planDeGiro } from '@pages/maps/helpers/grabacion/planGiro';
import { fijarEstadoGiro, giroCancelado, iniciarGiro } from '@hooksMaps/useEstadoGiro';
import { esperarMapa3d } from '@pages/maps/helpers/grabacion/esperar3d';

const SIN_VIDEO = 'Tu navegador no puede grabar video. Prueba con GIF o con Chrome.';
const AVISO_MS = 250;
const VIGILANCIA_MS = 200;
const TRASLADO_MS = 900;
const MARGEN_CUADRO_S = 0.004;

const diferencia = (rumbo, previo) => ((rumbo - previo + 540) % 360) - 180;

const girarYGrabar = ({ map, plan, gif, alCuadro, alAvance, cancelado }) => new Promise((resolver, rechazar) => {
    const inicio = performance.now();
    let previo = map.getBearing();
    let girado = 0;
    let ultimo = -Infinity;
    let indice = 0;
    let ultimoAviso = 0;
    let ocupado = false;
    let pendiente = Promise.resolve();
    const intervaloGif = plan.duracionVuelta / plan.cuadros;
    const tomar = (rumbo, segundo) => {
        ocupado = true;
        pendiente = alCuadro(rumbo, segundo).catch(rechazar).finally(() => { ocupado = false; });
    };
    const paso = (ahora) => {
        const rumbo = map.getBearing();
        girado += diferencia(rumbo, previo);
        previo = rumbo;
        const transcurrido = (ahora - inicio) / 1000;
        if (cancelado() || Math.abs(girado) >= 360 || (gif && indice >= plan.cuadros)) {
            pendiente.then(resolver);
            return;
        }
        if (!ocupado && gif && transcurrido >= indice * intervaloGif) {
            tomar(rumbo, indice / plan.fps);
            indice += 1;
        } else if (!ocupado && !gif && transcurrido - ultimo >= 1 / plan.fps - MARGEN_CUADRO_S) {
            ultimo = transcurrido;
            tomar(rumbo, transcurrido);
        }
        if (ahora - ultimoAviso > AVISO_MS) {
            ultimoAviso = ahora;
            alAvance(Math.min(1, Math.abs(girado) / 360));
        }
        requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
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

const esperarClic = map => new Promise((resolver) => {
    const vigilar = setInterval(() => {
        if (!giroCancelado()) return;
        terminar(null);
    }, VIGILANCIA_MS);
    const alClic = evento => terminar([evento.lngLat.lng, evento.lngLat.lat]);
    function terminar(valor) {
        clearInterval(vigilar);
        map.off('click', alClic);
        resolver(valor);
    }
    map.on('click', alClic);
});

const centrarEn = (map, centro) => new Promise((resolver) => {
    map.once('moveend', resolver);
    map.easeTo({ center: centro, duration: TRASLADO_MS });
});

export const useGrabarGiro = () => {
    const { map3dRef, setOrbita, velocidadOrbita, active, enter } = useView3d();
    const enCursoRef = useRef(false);

    const grabar = useCallback(async ({ tipo, segundosGif, calidad, titulo, totalCapas, centro = 'actual' }) => {
        if (enCursoRef.current) return;
        enCursoRef.current = true;
        iniciarGiro();
        if (!active) enter();
        let map;
        try {
            map = await esperarMapa3d(map3dRef);
        } catch (fallo) {
            fijarEstadoGiro({ fase: null, error: fallo.message });
            enCursoRef.current = false;
            return;
        }
        setOrbita(false);
        if (centro === 'punto') {
            fijarEstadoGiro({ fase: 'eligiendo' });
            const punto = await esperarClic(map);
            if (!punto) {
                fijarEstadoGiro(null);
                enCursoRef.current = false;
                return;
            }
            fijarEstadoGiro({ fase: 'preparando' });
            await centrarEn(map, punto);
        }
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
            const alCuadro = (rumbo, segundo) => {
                componerCuadro(ctx, {
                    ancho: plan.ancho,
                    alto: plan.alto,
                    mapa: map.getCanvas(),
                    recursos,
                    rumbo,
                    ubicacion: ubicacionDe(map),
                    titulo,
                    totalCapas,
                    compacto: tipo === 'gif',
                });
                return codificador.agregar(segundo);
            };
            setOrbita(true);
            fijarEstadoGiro({ fase: 'grabando', progreso: 0 });
            await girarYGrabar({ map, plan, gif: tipo === 'gif', alCuadro, alAvance: progreso => fijarEstadoGiro({ progreso }), cancelado: giroCancelado });
            setOrbita(false);
            if (giroCancelado()) {
                codificador.cancelar();
                return;
            }
            fijarEstadoGiro({ fase: 'guardando', progreso: 1 });
            const archivo = await codificador.terminar();
            triggerDownload(archivo, `${nombreDeArchivo(titulo)}${codificador.extension}`);
            trackView3d('grabar_giro', { formato: tipo, centro, segundos: Math.round(plan.duracionVuelta) });
            fijarEstadoGiro(null);
        } catch (fallo) {
            codificador?.cancelar();
            fijarEstadoGiro({ fase: null, error: fallo?.message || 'No se pudo grabar la vuelta.' });
        } finally {
            setOrbita(false);
            map.jumpTo({ bearing: inicio });
            enCursoRef.current = false;
            if (giroCancelado()) fijarEstadoGiro(null);
        }
    }, [map3dRef, setOrbita, velocidadOrbita, active, enter]);

    return { grabar };
};
