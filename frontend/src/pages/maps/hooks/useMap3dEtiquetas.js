import { useEffect, useState } from 'react';
import GeoJSON from 'ol/format/GeoJSON';
import { toLonLat } from 'ol/proj';
import { getUid } from 'ol/util';
import { countVectorFeatures, fetchVectorFeatures } from '@services/vectorLayerService';
import { VECTOR_FEATURE_LIMIT } from '@pages/maps/helpers/serviceMode';
import { anclaDeEtiqueta, cuerpoSldSinTexto, parsearSld, textoDeEtiqueta, zoomsDeEscala } from '@pages/maps/helpers/etiquetasSld';
import {
    asegurarImagenesDeEtiqueta, idDeEtiqueta, puntoDeEtiqueta, registrarEstiloDeEtiqueta, registrarEtiquetas,
} from '@pages/maps/helpers/etiquetasDibujo';
import { managedIds, removeGeojson, replaceLayers, upsertGeojson } from '@pages/maps/helpers/map3dLayerSpecs';
import { useOlWmsRevision } from './useOlWmsRevision';

const PREFIX = 'etq-';
const MAX_ETIQUETAS_EMPALMADAS = 60;
const MAX_CUERPO_SLD = 6000;
const SIN_CUERPOS = new Map();
const SIN_DE_PIE = new Map();
const LECTOR = new GeoJSON();
const slds = new Map();
const entidades = new Map();

const pedirSld = (wmsConfig, nombre) => {
    if (!slds.has(nombre)) {
        const url = `${wmsConfig.baseUrl}?${new URLSearchParams({ service: 'WMS', version: '1.1.1', request: 'GetStyles', layers: nombre })}`;
        slds.set(nombre, fetch(url).then(r => (r.ok ? r.text() : null)).then(xml => (xml ? parsearSld(xml) : null)).catch(() => null));
    }
    return slds.get(nombre);
};

export const entradasWms = (olMap) => olMap.getLayers().getArray()
    .filter(capa => capa.get('mergedLayers') && capa.getVisible())
    .map((capa) => {
        const filtros = String(capa.getSource().getParams()?.CQL_FILTER || '');
        const segmentos = filtros ? filtros.split(';') : [];
        return {
            uid: getUid(capa),
            ids: capa.get('mergedLayers').flatMap(entrada => (entrada.subLayers || []).map(sub => sub.id)),
            entradas: capa.get('mergedLayers').map((entrada, i) => {
                const cql = (segmentos[i] || '').trim();
                return { nombre: entrada.layerName, estilo: entrada.styles || '', wmsConfig: entrada.wmsConfig, cql: !cql || cql.toUpperCase() === 'INCLUDE' ? null : cql };
            }),
        };
    });

const limpio = (nombre) => nombre.replace(/[^\w]+/g, '_');
const idDeFuente = (nombre, regla) => `${PREFIX}${limpio(nombre)}-${regla}`;

const puntosDe = (json, partes) => ({
    type: 'FeatureCollection',
    features: LECTOR.readFeatures(json || { type: 'FeatureCollection', features: [] }).flatMap((feature) => {
        const punto = puntoDeEtiqueta(feature.getGeometry());
        const texto = textoDeEtiqueta(partes, feature.getProperties());
        return punto && texto ? [{ type: 'Feature', properties: { _texto: texto }, geometry: { type: 'Point', coordinates: toLonLat(punto) } }] : [];
    }),
});

const capaDeEtiquetas = (sourceId, regla, clave, { planos, escala }, cuantas) => ({
    id: `${sourceId}-texto`,
    type: 'symbol',
    source: sourceId,
    ...zoomsDeEscala(regla.minEscala, regla.maxEscala),
    layout: {
        'icon-image': idDeEtiqueta(clave),
        'icon-size': escala,
        ...anclaDeEtiqueta(regla.ubicacion),
        'icon-allow-overlap': cuantas <= MAX_ETIQUETAS_EMPALMADAS,
        'icon-padding': 2,
        'icon-pitch-alignment': planos ? 'map' : 'viewport',
        'icon-rotation-alignment': planos ? 'map' : 'viewport',
    },
});

const pedirEntidades = (entrada) => {
    const clave = `${entrada.nombre}|${entrada.cql || ''}`;
    if (!entidades.has(clave)) {
        entidades.set(clave, countVectorFeatures(entrada.wmsConfig, entrada.cql)
            .then(total => (total === null || total > VECTOR_FEATURE_LIMIT ? null : fetchVectorFeatures(entrada.wmsConfig, entrada.cql)))
            .catch((error) => { entidades.delete(clave); throw error; }));
    }
    return entidades.get(clave);
};

const dibujarEntrada = async (map, entrada, parsed, opciones, signal) => {
    const json = await pedirEntidades(entrada);
    if (!json || signal.aborted) return;
    parsed.reglas.forEach((regla, indice) => {
        if (regla.filtrada) return;
        const sourceId = idDeFuente(entrada.nombre, indice);
        const clave = `${entrada.nombre}#${indice}`;
        registrarEstiloDeEtiqueta(clave, regla);
        const puntos = puntosDe(json, regla.partes);
        asegurarImagenesDeEtiqueta(map, clave, new Set(puntos.features.map(f => f.properties._texto)));
        upsertGeojson(map, sourceId, puntos);
        replaceLayers(map, sourceId, [capaDeEtiquetas(sourceId, regla, clave, opciones, puntos.features.length)]);
    });
};

const soloDePie = (ids, dePie) => ids.length > 0 && ids.every(id => dePie.get(id) === 0);

export const useMap3dEtiquetas = (map, olMapRef, { activo = true, escala = 1, dePie = SIN_DE_PIE } = {}) => {
    const revision = useOlWmsRevision(map, olMapRef);
    const [cuerpos, setCuerpos] = useState(SIN_CUERPOS);

    useEffect(() => (map ? registrarEtiquetas(map) : undefined), [map]);

    useEffect(() => {
        const olMap = olMapRef.current;
        if (!map || !olMap) return undefined;
        const controller = new AbortController();
        const capas = entradasWms(olMap).filter(({ ids }) => activo || soloDePie(ids, dePie));
        Promise.all(capas.map(async ({ uid, ids, entradas }) => {
            const resueltas = await Promise.all(entradas.map(e => pedirSld(e.wmsConfig, e.nombre)));
            if (controller.signal.aborted || resueltas.some(p => !p)) return null;
            const conTexto = entradas.map((entrada, i) => ({ entrada, parsed: resueltas[i] }))
                .filter(({ entrada, parsed }) => parsed.reglas.length && (!entrada.estilo || entrada.estilo === parsed.estilo));
            if (!conTexto.length) return null;
            const sinTexto = new Set(conTexto.map(({ entrada }) => entrada.nombre));
            const cuerpo = activo && !soloDePie(ids, dePie) ? cuerpoSldSinTexto(entradas.map((entrada, i) => ({
                nombre: entrada.nombre,
                estilo: entrada.estilo || resueltas[i].estilo,
                capaSinTexto: sinTexto.has(entrada.nombre) ? resueltas[i].capaSinTexto : null,
            }))) : null;
            if (cuerpo && encodeURIComponent(cuerpo).length > MAX_CUERPO_SLD) return null;
            conTexto.forEach(({ entrada, parsed }) => dibujarEntrada(map, entrada, parsed, { planos: !activo, escala }, controller.signal)
                .catch(error => { if (!controller.signal.aborted) console.warn('[mapa3d] sin etiquetas para', entrada.nombre, error?.message || error); }));
            return { uid, cuerpo, nombres: [...sinTexto].map(limpio) };
        })).then((resultados) => {
            if (controller.signal.aborted) return;
            const vigentes = resultados.filter(Boolean);
            const nombres = new Set(vigentes.flatMap(r => r.nombres));
            managedIds(map, PREFIX).filter(id => !nombres.has(id.slice(PREFIX.length).replace(/-\d+$/, ''))).forEach(id => removeGeojson(map, id));
            const pares = vigentes.filter(r => r.cuerpo).map(r => [r.uid, r.cuerpo]);
            setCuerpos(pares.length ? new Map(pares) : SIN_CUERPOS);
        });

        return () => controller.abort();
    }, [map, olMapRef, activo, escala, dePie, revision]);

    return cuerpos;
};
