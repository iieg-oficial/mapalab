import { useEffect, useRef } from 'react';
import { useCaminar } from '@contexts/CaminarContext';
import { loadMaplibre } from '@pages/maps/helpers/maplibreLoader';
import { VIEW3D_PITCH_MAX } from '@pages/maps/helpers/view3d';
import { espacioEn, prepararEdificio } from '@pages/maps/helpers/caminar/geometriaEdificio';
import { crearCaminante, mirar, pasoCaminante, pisoActual, puntoMasLibre, rumboMasLibre } from '@pages/maps/helpers/caminar/fisicaCaminar';
import { camaraPrimera, camaraTercera } from '@pages/maps/helpers/caminar/camaraCaminar';
import { fetchEdificioInstituto } from '@services/institutoService';
import { entradaCaminar, useCaminarTeclado } from './useCaminarTeclado';

const INTERACCIONES = ['dragPan', 'dragRotate', 'scrollZoom', 'touchZoomRotate', 'touchPitch', 'keyboard', 'doubleClickZoom', 'boxZoom'];
const MIRADA_POR_PX = 0.2;
const ESPACIO_INICIAL = 'Vestíbulo';
const SE_QUEDAN = new Set(['fondo', 'base']);

const ocultarCapas = (map, ocultas) => (map.getStyle()?.layers ?? [])
    .filter(l => !SE_QUEDAN.has(l.id) && l.type !== 'custom' && map.getLayoutProperty(l.id, 'visibility') !== 'none')
    .forEach((l) => {
        ocultas.add(l.id);
        map.setLayoutProperty(l.id, 'visibility', 'none');
    });

const mostrarCapas = (map, ids) => ids.forEach((id) => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible');
});

const claveCamara = (c, suelo, tercera) => [c.x, c.y, c.z, c.rumbo, c.mirada].map(v => v.toFixed(3)).join('|') + `|${suelo.toFixed(2)}|${tercera}`;

const configurarMapa = (map, activo) => {
    INTERACCIONES.forEach(nombre => map[nombre]?.[activo ? 'disable' : 'enable']());
    map.setCenterClampedToGround(!activo);
    map.setMaxPitch(activo ? 89 : VIEW3D_PITCH_MAX);
    map.setMaxZoom(activo ? 24 : 22);
};

const puntoInicial = (edificio) => {
    const espacio = edificio.espacios.find(e => e.nombre === ESPACIO_INICIAL) || edificio.espacios.find(e => e.tipo === 'circulacion');
    return (espacio && puntoMasLibre(edificio, espacio.poligonos)) || [0, 0];
};

export const useCaminata = (map, principal) => {
    const caminar = useCaminar();
    const activo = caminar.activo && principal && !!map;
    const vivo = useRef(caminar);
    vivo.current = caminar;

    useCaminarTeclado(activo, caminar);

    useEffect(() => {
        if (!activo) return undefined;
        let cancelado = false;
        let cuadro = null;
        let capa = null;
        let edificio = null;
        let c = null;
        let anterior = performance.now();
        let ultimo = '';
        const salida = { center: map.getCenter().toArray(), zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() };
        const leer = () => ({ caminante: c, alturaBase: 0, tercera: vivo.current.tercera });

        const terrenoPrevio = map.getTerrain();
        map.setTerrain(null);
        configurarMapa(map, true);
        const ocultas = new Set();
        const alCambiarEstilo = () => ocultarCapas(map, ocultas);
        alCambiarEstilo();
        map.on('styledata', alCambiarEstilo);
        let ultimaCamara = '';
        let seMovia = false;
        vivo.current.publicar({ cargando: true });

        Promise.all([loadMaplibre(), import('@pages/maps/helpers/caminar/capaEdificio'), fetchEdificioInstituto()])
            .then(([maplibregl, { crearCapaEdificio }, datos]) => {
                if (cancelado) return;
                edificio = prepararEdificio(datos);
                const [x, y] = puntoInicial(edificio);
                c = crearCaminante(x, y, edificio.base.nivel, rumboMasLibre(edificio, x, y));
                map.jumpTo({ center: edificio.origen, zoom: 19, pitch: 60 });
                capa = crearCapaEdificio(maplibregl, edificio, { leer });
                if (!map.getLayer(capa.id)) map.addLayer(capa);
                cuadro = requestAnimationFrame(andar);
            })
            .catch((error) => {
                console.error('[caminar] no se pudo cargar el edificio', error);
                if (!cancelado) vivo.current.publicar({ error: true });
            });

        const contenedor = map.getCanvasContainer();
        let arrastre = null;
        const alPresionar = (e) => {
            if (e.pointerType === 'touch' || e.button !== 0) return;
            arrastre = { x: e.clientX, y: e.clientY };
        };
        const alMover = (e) => {
            if (!arrastre || !c) return;
            c = mirar({ ...c, rumbo: (c.rumbo + (e.clientX - arrastre.x) * MIRADA_POR_PX + 360) % 360 }, -(e.clientY - arrastre.y) * MIRADA_POR_PX);
            arrastre = { x: e.clientX, y: e.clientY };
        };
        const alSoltar = () => { arrastre = null; };
        contenedor.addEventListener('pointerdown', alPresionar);
        window.addEventListener('pointermove', alMover);
        window.addEventListener('pointerup', alSoltar);

        const andar = (ahora) => {
            const dt = Math.min(0.05, (ahora - anterior) / 1000);
            anterior = ahora;
            const suelo = 0;
            c = pasoCaminante(c, entradaCaminar(vivo.current.teclasRef.current), edificio, dt, () => 0);
            const camara = claveCamara(c, suelo, vivo.current.tercera);
            if (camara !== ultimaCamara) {
                ultimaCamara = camara;
                map.jumpTo(vivo.current.tercera ? camaraTercera(map, edificio, c, suelo) : camaraPrimera(map, edificio.origen, c, suelo));
            } else if (c.moviendo !== seMovia) {
                map.triggerRepaint();
            }
            seMovia = c.moviendo;
            const piso = pisoActual(edificio, c.z).nombre;
            const espacio = c.z < edificio.base.nivel + 1.5 ? espacioEn(edificio, c.x, c.y)?.nombre ?? null : null;
            const clave = `${piso}|${espacio}`;
            if (clave !== ultimo) {
                ultimo = clave;
                vivo.current.publicar({ piso, espacio });
            }
            cuadro = requestAnimationFrame(andar);
        };

        return () => {
            cancelado = true;
            cancelAnimationFrame(cuadro);
            contenedor.removeEventListener('pointerdown', alPresionar);
            window.removeEventListener('pointermove', alMover);
            window.removeEventListener('pointerup', alSoltar);
            vivo.current.publicar(null);
            try {
                if (capa && map.getLayer(capa.id)) map.removeLayer(capa.id);
                map.off('styledata', alCambiarEstilo);
                mostrarCapas(map, ocultas);
                if (terrenoPrevio) map.setTerrain(terrenoPrevio);
                configurarMapa(map, false);
                map.jumpTo({ ...salida, roll: 0 });
            } catch {
                return;
            }
        };
    }, [activo, map]);
};
