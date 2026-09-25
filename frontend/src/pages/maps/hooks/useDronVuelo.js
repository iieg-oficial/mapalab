import { useEffect, useRef } from 'react';
import { useDron } from '@contexts/DronContext';
import { useView3d } from '@contexts/View3dContext';
import { loadMaplibre } from '@pages/maps/helpers/maplibreLoader';
import { VIEW3D_PITCH_MAX, cameraToOlView } from '@pages/maps/helpers/view3d';
import { JALISCO_BOUNDS } from '@pages/maps/helpers/wmsConfig';
import {
    SIN_ENTRADA, aplicarMandos, amortiguar, anguloCorto, crearDron, desplazar, entradaGuiada, mirarCamara, pasoDron, rapidezKmh,
} from '@pages/maps/helpers/dron/fisicaDron';
import { mandosDe } from '@pages/maps/helpers/dron/aeronaves';
import { metaTercera, opcionesPrimera, opcionesTercera, seguirCamara } from '@pages/maps/helpers/dron/camaraDron';
import { entradaManual, hayEntradaManual, useDronTeclado } from './useDronTeclado';

const INTERACCIONES = ['dragPan', 'dragRotate', 'scrollZoom', 'touchZoomRotate', 'touchPitch', 'keyboard', 'doubleClickZoom', 'boxZoom'];
const [[OESTE, SUR], [ESTE, NORTE]] = [JALISCO_BOUNDS.coords.slice(0, 2), JALISCO_BOUNDS.coords.slice(2)];
const CENTRO = [(OESTE + ESTE) / 2, (SUR + NORTE) / 2];
const RADIO_AUTO = 180000;
const MUESTRAS = 50;
const MIRADA_POR_PX = 0.25;
const SINCRONIA_2D_MS = 1500;
const DURACION_CHOQUE_MS = 2600;

const sincronizar2d = (map, olMap) => {
    const view = olMap?.getView();
    if (!view) return;
    const { center, zoom } = cameraToOlView({ center: map.getCenter().toArray(), zoom: map.getZoom() });
    view.setCenter(center);
    view.setZoom(zoom);
};

const configurarMapa = (map, activo) => {
    INTERACCIONES.forEach(nombre => map[nombre]?.[activo ? 'disable' : 'enable']());
    map.setCenterClampedToGround(!activo);
    map.setMaxPitch(activo ? 89 : VIEW3D_PITCH_MAX);
    map.setMaxZoom(activo ? 24 : 22);
};

const perfilAdelante = (dron, sueloEn, exageracion) => {
    const r = (dron.rumbo * Math.PI) / 180;
    return Array.from({ length: MUESTRAS + 1 }, (_, i) => {
        const d = -300 + i * 90;
        return { d, h: sueloEn(desplazar(dron.lngLat, Math.sin(r) * d, Math.cos(r) * d)) / exageracion };
    });
};

const relieveAdelante = (dron, sueloEn) => {
    const r = (dron.rumbo * Math.PI) / 180;
    for (let d = 150; d <= 1500; d += 150) {
        if (sueloEn(desplazar(dron.lngLat, Math.sin(r) * d, Math.cos(r) * d)) > dron.alt - 10) return true;
    }
    return false;
};

export const useDronVuelo = (map, principal, olRef = null) => {
    const dron = useDron();
    const { exaggeration } = useView3d();
    const activo = dron.activo && principal && !!map;
    const vivo = useRef({});
    vivo.current = { ...dron, exaggeration };

    useDronTeclado(activo, dron);

    useEffect(() => {
        if (!activo) return undefined;
        let cancelado = false;
        let cuadro = null;
        let capa = null;
        let anterior = performance.now();
        let t = 0;
        let n = 0;
        let pantalla = null;
        let muestras = [];
        let camara = null;
        let alNorte = false;
        let ultimaSincronia = 0;
        const sueloEn = lngLat => map.queryTerrainElevation(lngLat) ?? 0;
        const centro = map.getCenter().toArray();
        let estado = crearDron(centro, sueloEn(centro), map.getBearing());
        let choqueDesde = null;
        const leer = () => ({ dron: estado, config: vivo.current.config, perfil: vivo.current.perfil, choqueDesde });

        configurarMapa(map, true);
        vivo.current.accionesRef.current = {
            nivelar: () => { estado = { ...estado, camara: -12 }; },
            norte: () => { alNorte = true; },
            mirar: (dx, dy) => { estado = mirarCamara({ ...estado, rumbo: (estado.rumbo + dx * MIRADA_POR_PX + 360) % 360 }, -dy * MIRADA_POR_PX); },
        };

        Promise.all([loadMaplibre(), import('@pages/maps/helpers/dron/capaDron')]).then(([maplibregl, { crearCapaDron, ID_CAPA_DRON }]) => {
            if (cancelado) return;
            capa = crearCapaDron(maplibregl, { leer, alPantalla: (p) => { pantalla = p; } });
            if (!map.getLayer(ID_CAPA_DRON)) map.addLayer(capa);
        }).catch(error => console.error('[dron] no se pudo cargar el modelo', error));

        const contenedor = map.getCanvasContainer();
        let arrastre = null;
        const alPresionar = (e) => {
            if (e.pointerType === 'touch' || e.button !== 0) return;
            arrastre = { x: e.clientX, y: e.clientY };
            contenedor.setPointerCapture?.(e.pointerId);
        };
        const alMover = (e) => {
            if (!arrastre) return;
            vivo.current.accionesRef.current.mirar(e.clientX - arrastre.x, e.clientY - arrastre.y);
            arrastre = { x: e.clientX, y: e.clientY };
        };
        const alSoltar = () => { arrastre = null; };
        contenedor.addEventListener('pointerdown', alPresionar);
        window.addEventListener('pointermove', alMover);
        window.addEventListener('pointerup', alSoltar);

        const volar = (ahora) => {
            const dt = Math.min(0.05, (ahora - anterior) / 1000);
            anterior = ahora;
            t += dt;
            n += 1;
            const actual = vivo.current;
            const controles = actual.controlesRef.current;
            if (hayEntradaManual(controles) && actual.auto) actual.setAuto(false);
            const guiada = entradaGuiada(estado, { destino: actual.destinoRef.current, auto: actual.auto, t, centro: CENTRO, radio: RADIO_AUTO });
            if (guiada?.llego) actual.destinoRef.current = null;
            const entrada = guiada && !guiada.llego ? guiada.entrada : (guiada?.llego ? SIN_ENTRADA : entradaManual(controles));
            if (choqueDesde !== null) {
                if (ahora - choqueDesde > DURACION_CHOQUE_MS) {
                    estado = { ...crearDron(estado.lngLat, sueloEn(estado.lngLat), estado.rumbo), camara: estado.camara };
                    choqueDesde = null;
                }
            } else {
                estado = pasoDron(estado, aplicarMandos(entrada, mandosDe(actual.config.modelo)), {
                    perfil: actual.perfil, velocidad: actual.config.velocidad, seguir: actual.config.seguir, dt, sueloEn,
                });
                if (estado.choque) {
                    choqueDesde = ahora;
                    estado = { ...estado, vEste: 0, vNorte: 0, vVert: 0, giro: 0 };
                    actual.destinoRef.current = null;
                    if (actual.auto) actual.setAuto(false);
                }
            }
            if (alNorte) {
                const falta = anguloCorto(-estado.rumbo);
                estado = { ...estado, rumbo: (estado.rumbo + falta - amortiguar(falta, 0, 5, dt) + 360) % 360 };
                alNorte = Math.abs(falta) > 0.5;
            }
            if (actual.config.tercera) {
                const lejania = map.getCanvas().clientWidth < 768 ? 1.8 : 1;
                camara = seguirCamara(camara, metaTercera(estado, { distancia: actual.perfil.distancia, sueloEn, lejania }), dt);
                map.jumpTo(opcionesTercera(map, camara, estado));
            } else {
                camara = null;
                map.jumpTo(opcionesPrimera(map, estado));
            }
            if (n % 6 === 1) muestras = perfilAdelante(estado, sueloEn, actual.exaggeration || 1);
            const agl = estado.alt - estado.piso;
            actual.publicar({
                dron: estado,
                agl,
                msnm: estado.piso / (actual.exaggeration || 1) + agl,
                kmh: rapidezKmh(estado, actual.config.seguir),
                camaraGrados: estado.camara,
                pantalla,
                muestras,
                choque: choqueDesde !== null,
                alerta: n % 6 === 1 ? relieveAdelante(estado, sueloEn) : actual.telemetriaRef.current?.alerta,
            });
            if (ahora - ultimaSincronia > SINCRONIA_2D_MS) {
                ultimaSincronia = ahora;
                sincronizar2d(map, olRef?.current);
            }
            cuadro = requestAnimationFrame(volar);
        };
        cuadro = requestAnimationFrame(volar);

        return () => {
            cancelado = true;
            cancelAnimationFrame(cuadro);
            contenedor.removeEventListener('pointerdown', alPresionar);
            window.removeEventListener('pointermove', alMover);
            window.removeEventListener('pointerup', alSoltar);
            vivo.current.accionesRef.current = {};
            vivo.current.publicar(null);
            try {
                if (capa && map.getLayer(capa.id)) map.removeLayer(capa.id);
                configurarMapa(map, false);
                map.jumpTo({ center: estado.lngLat, zoom: Math.min(map.getZoom(), 14), pitch: 60, bearing: estado.rumbo, roll: 0 });
            } catch {
                return;
            }
        };
    }, [activo, map, olRef]);
};
