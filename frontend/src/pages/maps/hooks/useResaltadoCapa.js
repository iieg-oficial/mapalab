import { useEffect, useRef } from 'react';
import { unByKey } from 'ol/Observable';
import { getUid } from 'ol/util';
import { buildTargetOverlay, classifyLayer, resolveTargetIds } from '@pages/maps/helpers/layers/aislarCapa';
import { suscribirCapaResaltada } from '@pages/maps/helpers/layers/capaResaltada';

const FACTOR = 0.2;
const DESVANECER_MS = 150;
const ESPERA_MS = 200;

const claveVista = (map) => {
    const vista = map.getView();
    return `${vista.getCenter()?.join(',')}|${vista.getResolution()}|${map.getSize()?.join('x')}`;
};

const firmaDe = (host) => JSON.stringify(host.getSource()?.getParams?.() || {});

export const useResaltadoCapa = ({ mapRef, paneMapInstances, compareMode, allLayers, cancelPulse }) => {
    const vivo = useRef({ mapRef, paneMapInstances, compareMode, allLayers, cancelPulse });
    vivo.current = { mapRef, paneMapInstances, compareMode, allLayers, cancelPulse };

    useEffect(() => {
        const estado = { id: null, originales: new Map(), regreso: new Map(), overlays: [], timer: null, cuadro: null, escuchas: [], recalculo: null };
        const cache = new Map();

        const animar = (capas, destino, alTerminar) => {
            cancelAnimationFrame(estado.cuadro);
            const desde = capas.map(capa => [capa, capa.getOpacity(), destino(capa)]);
            const inicio = performance.now();
            const paso = (ahora) => {
                const t = Math.min(1, (ahora - inicio) / DESVANECER_MS);
                desde.forEach(([capa, a, b]) => capa.setOpacity(a + (b - a) * t));
                if (t < 1) estado.cuadro = requestAnimationFrame(paso);
                else alTerminar?.();
            };
            estado.cuadro = requestAnimationFrame(paso);
        };

        const atenuar = (capa) => {
            if (!estado.originales.has(capa)) estado.originales.set(capa, capa.getOpacity());
            return estado.originales.get(capa) * FACTOR;
        };

        const dejarDeVigilar = () => {
            unByKey(estado.escuchas);
            estado.escuchas = [];
            cancelAnimationFrame(estado.recalculo);
            estado.recalculo = null;
        };

        const soltar = (inmediato) => {
            dejarDeVigilar();
            clearTimeout(estado.timer);
            cancelAnimationFrame(estado.cuadro);
            estado.overlays.forEach(({ map, overlay }) => map.removeLayer(overlay));
            const destino = new Map([...estado.regreso, ...estado.originales]);
            if (inmediato) {
                destino.forEach((opacidad, capa) => capa.setOpacity(opacidad));
                estado.regreso = new Map();
            } else {
                estado.regreso = destino;
                animar([...destino.keys()], capa => destino.get(capa), () => { estado.regreso = new Map(); });
            }
            estado.id = null;
            estado.originales = new Map();
            estado.overlays = [];
        };

        const overlayDe = (host, idxs, id) => {
            const clave = `${getUid(host)}|${id}`;
            const firma = firmaDe(host);
            const guardado = cache.get(clave);
            if (guardado?.firma === firma) return guardado.overlay;
            const overlay = buildTargetOverlay(host, idxs);
            if (!overlay) return null;
            overlay.set('resaltado', true);
            cache.set(clave, { overlay, firma });
            return overlay;
        };

        const aislarMixtas = (mixtas, id) => {
            mixtas.forEach(({ map, host, idxs }) => {
                const overlay = overlayDe(host, idxs, id);
                if (!overlay) return;
                map.addLayer(overlay);
                estado.overlays.push({ map, overlay });
                const atenuarHost = () => {
                    if (estado.id !== id) return;
                    overlay.set('vista', claveVista(map));
                    animar([...estado.originales.keys(), host], atenuar);
                };
                if (overlay.get('vista') === claveVista(map)) atenuarHost();
                else overlay.getSource().once('imageloadend', atenuarHost);
            });
        };

        const aplicar = (id) => {
            soltar(true);
            const { mapRef: ref, paneMapInstances: panes, compareMode: comparar, allLayers: capas, cancelPulse: cancelar } = vivo.current;
            const mapas = comparar?.active ? Object.values(panes || {}).filter(Boolean) : [ref?.current].filter(Boolean);
            const ids = resolveTargetIds(id, capas);
            if (!mapas.length || !ids.size) return;
            cancelar?.();
            estado.id = id;
            const otras = [];
            const mixtas = [];
            mapas.forEach(map => map.getLayers().forEach((capa) => {
                if (capa.get('resaltado') || !capa.getVisible()) return;
                const info = classifyLayer(capa, ids);
                if (info.role === 'other') otras.push(capa);
                if (info.role === 'mixed') mixtas.push({ map, host: capa, idxs: info.targetIdxs });
            }));
            animar(otras, atenuar);
            if (mixtas.length) estado.timer = setTimeout(() => aislarMixtas(mixtas, id), ESPERA_MS);
            vigilar(mapas, id);
        };

        const vigilar = (mapas, id) => {
            const recalcular = (evento) => {
                if (evento?.element?.get?.('resaltado')) return;
                if (evento?.key && evento.key !== 'mergedLayers' && evento.key !== 'memberIds') return;
                if (estado.recalculo) return;
                estado.recalculo = requestAnimationFrame(() => {
                    estado.recalculo = null;
                    if (estado.id === id) aplicar(id);
                });
            };
            mapas.forEach((map) => {
                const coleccion = map.getLayers();
                estado.escuchas.push(coleccion.on(['add', 'remove'], recalcular));
                coleccion.forEach((capa) => {
                    if (!capa.get('resaltado')) estado.escuchas.push(capa.on('propertychange', recalcular));
                });
            });
        };

        const desuscribir = suscribirCapaResaltada((id, opciones) => (id ? aplicar(id) : soltar(!!opciones?.inmediato)));
        return () => {
            desuscribir();
            soltar(true);
            cache.clear();
        };
    }, []);
};
