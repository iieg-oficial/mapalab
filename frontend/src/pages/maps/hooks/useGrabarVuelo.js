import { useCallback, useEffect, useRef, useState } from 'react';
import { fromLonLat } from 'ol/proj';
import { useDron } from '@contexts/DronContext';
import { useView3d } from '@contexts/View3dContext';
import { useSider } from '@contexts/SiderContext';
import { triggerDownload } from '@services/downloadService';
import { trackView3d } from '@services/analyticsService';
import { crearCodificador } from '@pages/maps/helpers/grabacion/codificador';
import { cargarRecursos, componerCuadro } from '@pages/maps/helpers/grabacion/composicion';
import { nombreDeArchivo } from '@pages/maps/helpers/grabacion/planGiro';
import { CUADROS_POR_SEGUNDO, TAMANO_VUELO, planDeRuta, topeDeVuelo } from '@pages/maps/helpers/grabacion/planVuelo';
import { ALTO_INSTRUMENTO, ANCHO_INSTRUMENTO, dibujarInstrumentos, dibujarPerfil } from '@pages/maps/helpers/dron/instrumentosDron';

const ZOOM_UBICACION = 13;
const AVISO_MS = 250;
const SIN_VIDEO = 'Tu navegador no puede grabar video. Prueba con Chrome, Edge o Safari.';

const ESCALA_INSTRUMENTOS = 2;

const crearPanel = () => {
    const lienzo = document.createElement('canvas');
    lienzo.width = ANCHO_INSTRUMENTO * ESCALA_INSTRUMENTOS;
    lienzo.height = ALTO_INSTRUMENTO * ESCALA_INSTRUMENTOS;
    const ctx = lienzo.getContext('2d');
    ctx.scale(ESCALA_INSTRUMENTOS, ESCALA_INSTRUMENTOS);
    return { lienzo, ctx };
};

const cuadroDeVuelo = (ctx, { map, recursos, telemetria, dron, paneles, titulo, totalCapas, rastro }) => {
    const datos = { ...telemetria.dron, ...telemetria, perfil: dron.perfil, velocidad: dron.config.velocidad };
    dibujarInstrumentos(paneles.instrumentos.ctx, datos);
    dibujarPerfil(paneles.perfil.ctx, datos);
    const coord = fromLonLat(telemetria.dron.lngLat);
    const [ancho, alto] = TAMANO_VUELO;
    componerCuadro(ctx, {
        ancho,
        alto,
        mapa: map.getCanvas(),
        recursos,
        rumbo: map.getBearing(),
        ubicacion: { centro: coord, zoom: ZOOM_UBICACION, extension: null, marcador: { coord, rumbo: telemetria.dron.rumbo }, rastro: [...(rastro || []), telemetria.dron.lngLat] },
        titulo,
        totalCapas,
        instrumentos: paneles.instrumentos.lienzo,
        perfil: paneles.perfil.lienzo,
    });
};

export const useGrabarVuelo = ({ titulo, totalCapas, leerRastro }) => {
    const dron = useDron();
    const { map3dRef } = useView3d();
    const { isMobile } = useSider();
    const [segundos, setSegundos] = useState(null);
    const [error, setError] = useState(null);
    const sesionRef = useRef(null);
    const vivo = useRef({});
    vivo.current = { dron, titulo, totalCapas, leerRastro };
    const tope = topeDeVuelo(isMobile);
    const [topeActual, setTopeActual] = useState(tope);

    const detener = useCallback(() => { sesionRef.current?.detener(); }, []);

    const grabar = useCallback(async (camara, contenedor = 'mp4', { estimadoS = null } = {}) => {
        const map = map3dRef?.current;
        if (!map || sesionRef.current) return;
        const { setOpcion, config, camaraForzadaRef, telemetriaRef, aceleracionRef } = vivo.current.dron;
        const plan = planDeRuta({ estimadoS, tope });
        aceleracionRef.current = plan.aceleracion;
        setTopeActual(plan.mostrado);
        const terceraPrevia = config.tercera;
        const sesion = { detener: () => { sesion.pedido = true; } };
        sesionRef.current = sesion;
        setError(null);
        setOpcion('tercera', camara === 'tercera');
        camaraForzadaRef.current = camara === 'cono' ? 'cono' : null;
        const restaurar = () => {
            aceleracionRef.current = 1;
            camaraForzadaRef.current = null;
            setOpcion('tercera', terceraPrevia);
            sesionRef.current = null;
            setSegundos(null);
        };
        const lienzo = document.createElement('canvas');
        [lienzo.width, lienzo.height] = TAMANO_VUELO;
        const ctx = lienzo.getContext('2d');
        const paneles = { instrumentos: crearPanel(), perfil: crearPanel() };
        const [recursos, codificador] = await Promise.all([cargarRecursos(), crearCodificador(contenedor, lienzo, CUADROS_POR_SEGUNDO)]);
        if (!codificador) {
            setError(SIN_VIDEO);
            restaurar();
            return;
        }
        const inicio = performance.now();
        let ultimo = -1;
        let ultimoAviso = 0;
        let pendiente = Promise.resolve();
        let ocupado = false;
        let tomados = 0;
        let cuadro = null;
        let cerrado = false;

        const cerrar = async () => {
            if (cerrado) return;
            cerrado = true;
            cancelAnimationFrame(cuadro);
            document.removeEventListener('visibilitychange', alOcultar);
            const duracion = Math.max(0, ultimo);
            try {
                await pendiente;
                if (duracion > 0) {
                    const archivo = await codificador.terminar();
                    triggerDownload(archivo, `${nombreDeArchivo(vivo.current.titulo)}_dron${codificador.extension}`);
                    trackView3d('grabar_vuelo', { camara, formato: contenedor, segundos: Math.round(duracion) });
                } else {
                    codificador.cancelar();
                }
            } catch (fallo) {
                setError(fallo?.message || 'No se pudo guardar el video.');
            } finally {
                restaurar();
            }
        };
        const alOcultar = () => { if (document.hidden) cerrar(); };
        document.addEventListener('visibilitychange', alOcultar);
        sesion.detener = cerrar;

        const paso = (ahora) => {
            if (cerrado) return;
            const transcurrido = (ahora - inicio) / 1000;
            if (transcurrido >= plan.limite || sesion.pedido) {
                cerrar();
                return;
            }
            const telemetria = telemetriaRef.current;
            if (telemetria?.dron && !ocupado && transcurrido - ultimo >= plan.ritmo / CUADROS_POR_SEGUNDO - 0.004) {
                ultimo = transcurrido;
                ocupado = true;
                const segundoVideo = plan.ritmo > 1 ? tomados / CUADROS_POR_SEGUNDO : transcurrido;
                tomados += 1;
                cuadroDeVuelo(ctx, { map, recursos, telemetria, dron: vivo.current.dron, paneles, titulo: vivo.current.titulo, totalCapas: vivo.current.totalCapas, rastro: vivo.current.leerRastro?.() });
                pendiente = codificador.agregar(segundoVideo).finally(() => { ocupado = false; });
            }
            if (ahora - ultimoAviso > AVISO_MS) {
                ultimoAviso = ahora;
                setSegundos(transcurrido);
            }
            cuadro = requestAnimationFrame(paso);
        };
        setSegundos(0);
        cuadro = requestAnimationFrame(paso);
    }, [map3dRef, tope]);

    useEffect(() => () => sesionRef.current?.detener(), []);
    useEffect(() => { if (!dron.activo) sesionRef.current?.detener(); }, [dron.activo]);

    return { grabando: segundos !== null, segundos: segundos || 0, tope, topeActual, error, grabar, detener };
};
