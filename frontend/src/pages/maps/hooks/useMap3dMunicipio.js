import { useEffect, useRef } from 'react';
import GeoJSON from 'ol/format/GeoJSON';
import { transformExtent } from 'ol/proj';
import { getUid } from 'ol/util';
import { buildMaskPolygon, unionGeometriesExtent } from '@pages/maps/helpers/municipioMask';

const FUENTE = 'municipio-3d';
const EXTENT_AMPLIO = [-19000000, -12000000, 19000000, 16000000];
const FORMATO = new GeoJSON({ featureProjection: 'EPSG:3857', dataProjection: 'EPSG:4326' });

const capas = [
    { id: `${FUENTE}-velo`, type: 'fill', source: FUENTE, filter: ['==', ['get', 'rol'], 'velo'], paint: { 'fill-color': 'rgba(0, 0, 0, 0.18)' } },
    { id: `${FUENTE}-contorno`, type: 'line', source: FUENTE, filter: ['==', ['get', 'rol'], 'contorno'], layout: { 'line-join': 'round' }, paint: { 'line-color': '#5C2472', 'line-width': 2.5 } },
];

const figura = (rol, geometria) => ({ type: 'Feature', properties: { rol }, geometry: FORMATO.writeGeometryObject(geometria) });

export const coleccionMunicipio = (geometrias) => {
    if (!geometrias.length) return { type: 'FeatureCollection', features: [] };
    const velo = buildMaskPolygon(EXTENT_AMPLIO, geometrias, 0);
    return {
        type: 'FeatureCollection',
        features: [...(velo ? [figura('velo', velo)] : []), ...geometrias.map(g => figura('contorno', g))],
    };
};

export const limitesDeSeleccion = (geometrias) => {
    const extent = unionGeometriesExtent(geometrias);
    if (!extent) return null;
    const [oeste, sur, este, norte] = transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
    return [[oeste, sur], [este, norte]];
};

export const useMap3dMunicipio = (map, municipioMode, principal = true) => {
    const activo = !!municipioMode?.active;
    const geometrias = activo ? (municipioMode.geometries || []).map(m => m.geometry).filter(Boolean) : [];
    const clave = geometrias.map(g => `${getUid(g)}.${g.getRevision()}`).join(',');
    const geometriasRef = useRef(geometrias);
    geometriasRef.current = geometrias;

    useEffect(() => {
        if (!map) return undefined;
        map.addSource(FUENTE, { type: 'geojson', data: coleccionMunicipio([]) });
        capas.forEach(capa => map.addLayer(capa));
        return () => {
            capas.forEach(capa => { if (map.getLayer(capa.id)) map.removeLayer(capa.id); });
            if (map.getSource(FUENTE)) map.removeSource(FUENTE);
        };
    }, [map]);

    useEffect(() => {
        if (!map) return;
        const actuales = geometriasRef.current;
        map.getSource(FUENTE)?.setData(coleccionMunicipio(actuales));
        if (!principal || !actuales.length) return;
        const limites = limitesDeSeleccion(actuales);
        if (limites) map.fitBounds(limites, { padding: 80, maxZoom: 13, duration: 500, pitch: map.getPitch(), bearing: map.getBearing() });
    }, [map, clave, principal]);
};
