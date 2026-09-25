import { useEffect, useRef } from 'react';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { isVectorService } from '@pages/maps/helpers/serviceMode';
import { billboardLayout, iconExpression, parsePointRules, publicIconUrl } from '@pages/maps/helpers/billboardRules';
import { fetchLayerData } from '@pages/maps/helpers/map3dFeatures';
import { managedIds, removeGeojson, replaceLayers, upsertGeojson } from '@pages/maps/helpers/map3dLayerSpecs';
import { dibujarIcono, medidasDeIcono, tamanoPorEstilo } from '@pages/maps/helpers/estilosDePuntos3d';
import { OPCIONES_AGRUPAR, SIN_GRUPO, capaDeGrupos, registrarGrupos } from '@pages/maps/helpers/agrupamiento3d';
import { useOlWmsRevision } from './useOlWmsRevision';

const PREFIX = 'pt-';
const GEOSERVER_BASE = (import.meta.env.VITE_GEOSERVER_URL || '').replace(/\/+$/, '');

const cargarIcono = (map, id, url, size, estilo) => new Promise((resolve) => {
    if (map.hasImage(id)) {
        resolve(true);
        return;
    }
    const imagen = new Image();
    imagen.crossOrigin = 'anonymous';
    imagen.onload = () => {
        const ratio = window.devicePixelRatio || 1;
        const ancho = Math.round(size * ratio);
        const alto = Math.round(ancho * ((imagen.naturalHeight || 1) / (imagen.naturalWidth || 1))) || ancho;
        const medidas = medidasDeIcono(ancho, alto, estilo, ratio);
        const lienzo = document.createElement('canvas');
        lienzo.width = medidas.ancho;
        lienzo.height = medidas.alto;
        const ctx = lienzo.getContext('2d');
        dibujarIcono(ctx, imagen, ancho, alto, estilo, ratio);
        if (!map.hasImage(id)) map.addImage(id, { width: medidas.ancho, height: medidas.alto, data: ctx.getImageData(0, 0, medidas.ancho, medidas.alto).data }, { pixelRatio: ratio });
        resolve(true);
    };
    imagen.onerror = () => resolve(false);
    imagen.src = publicIconUrl(url, GEOSERVER_BASE);
});

const esPunto = (layerDef, modo) => layerDef?.geometryType === 'point' && !!layerDef.wmsConfig && !isVectorService(modo);

export const entradasDePuntos = (olMap, allLayers, getServiceMode) => olMap.getLayers().getArray()
    .filter(layer => layer.get('mergedLayers') && layer.getVisible())
    .flatMap((layer) => {
        const filtros = String(layer.getSource().getParams()?.CQL_FILTER || '');
        const segmentos = filtros ? filtros.split(';') : [];
        return layer.get('mergedLayers').map((entrada, indice) => ({
            clave: `${entrada.layerName}|${entrada.styles || ''}`,
            wmsConfig: entrada.wmsConfig,
            ids: (entrada.subLayers || []).map(sub => sub.id),
            cql: (segmentos[indice] || '').trim().toUpperCase() === 'INCLUDE' ? null : (segmentos[indice] || '').trim() || null,
        }));
    })
    .filter(({ ids }) => ids.length > 0 && ids.every(id => esPunto(findLayerDef(id, allLayers || []), getServiceMode?.(id))));

const idDeFuente = (clave) => `${PREFIX}${clave.replace(/[^\w]+/g, '_')}`;

export const useMap3dBillboards = (map, olMapRef, {
    allLayers, getServiceMode, getLegendJson, onReady, estilo = 'frente', escala = 1, agrupar = false,
}) => {
    const revision = useOlWmsRevision(map, olMapRef);
    const cacheRef = useRef(new Map());
    const listosRef = useRef(new Map());
    const agrupadasRef = useRef(new Map());

    useEffect(() => (map ? registrarGrupos(map) : undefined), [map]);

    useEffect(() => {
        const olMap = olMapRef.current;
        if (!map || !olMap) return undefined;
        const controller = new AbortController();
        const entradas = entradasDePuntos(olMap, allLayers, getServiceMode);
        const vigentes = new Set(entradas.map(({ clave }) => idDeFuente(clave)));
        const avisar = () => onReady(new Set([...listosRef.current.values()].flat()));

        managedIds(map, PREFIX).filter(id => !vigentes.has(id)).forEach(id => removeGeojson(map, id));
        [...listosRef.current.keys()].filter(id => !vigentes.has(id)).forEach(id => listosRef.current.delete(id));
        avisar();

        entradas.forEach(async ({ clave, wmsConfig, ids, cql }) => {
            const sourceId = idDeFuente(clave);
            const cacheKey = `${clave}|${cql || ''}`;
            try {
                let datos = cacheRef.current.get(cacheKey);
                if (!datos) {
                    datos = await fetchLayerData({ wmsConfig, cqlFilter: cql, signal: controller.signal, getLegendJson, layerId: ids[0] });
                    if (datos.status === 'ok') cacheRef.current.set(cacheKey, datos);
                }
                if (controller.signal.aborted || datos.status !== 'ok') return;
                const reglas = parsePointRules(datos.legendJson);
                if (!reglas) return;
                const idDe = (indice) => `ico:${estilo}:${reglas.rules[indice].url}`;
                const cargados = await Promise.all(reglas.rules.map((regla, i) => cargarIcono(map, idDe(i), regla.url, regla.size, estilo)));
                if (controller.signal.aborted || !cargados.some(Boolean)) return;
                if (map.getSource(sourceId) && agrupadasRef.current.get(sourceId) !== agrupar) removeGeojson(map, sourceId);
                if (map.getSource(sourceId)) upsertGeojson(map, sourceId, datos.collection);
                else map.addSource(sourceId, { type: 'geojson', data: datos.collection, ...(agrupar ? OPCIONES_AGRUPAR : {}) });
                agrupadasRef.current.set(sourceId, agrupar);
                replaceLayers(map, sourceId, [{
                    id: `${sourceId}-icono`,
                    type: 'symbol',
                    source: sourceId,
                    ...(agrupar ? { filter: SIN_GRUPO } : {}),
                    layout: { ...billboardLayout(iconExpression(reglas, idDe)), 'icon-size': tamanoPorEstilo(estilo, escala) },
                }, ...(agrupar ? [capaDeGrupos(sourceId, escala)] : [])]);
                listosRef.current.set(sourceId, ids);
                avisar();
            } catch (error) {
                if (!controller.signal.aborted) console.warn('[mapa3d] sin iconos de pie para', clave, error?.message || error);
            }
        });

        return () => controller.abort();
    }, [map, olMapRef, allLayers, getServiceMode, getLegendJson, onReady, revision, estilo, escala, agrupar]);
};
