import { useEffect, useMemo } from 'react';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import { SLOT_COLORS } from '@pages/maps/helpers/swipeTheme';

const Z_RAYADO = 900;
const PASO = 10;

const patron = (color) => {
    const lienzo = document.createElement('canvas');
    lienzo.width = PASO;
    lienzo.height = PASO;
    const ctx = lienzo.getContext('2d');
    if (!ctx) return color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-1, PASO + 1);
    ctx.lineTo(PASO + 1, -1);
    ctx.stroke();
    return ctx.createPattern(lienzo, 'repeat') || color;
};

const estilos = () => Object.fromEntries(['A', 'B'].map(lado => [lado, new Style({
    fill: new Fill({ color: patron(SLOT_COLORS[lado].fg) }),
    stroke: new Stroke({ color: SLOT_COLORS[lado].fg, width: 2 }),
})]));

export const useRayadoBarra = (mapas, municipios, reparto) => {
    const capas = useMemo(() => {
        const porLado = estilos();
        return mapas.map(() => new VectorLayer({
            source: new VectorSource(),
            zIndex: Z_RAYADO,
            style: feature => porLado[feature.get('lado')],
            properties: { name: 'numeralia-rayado-barra' },
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapas[0], mapas[1]]);

    useEffect(() => {
        capas.forEach((capa, i) => mapas[i]?.addLayer(capa));
        return () => capas.forEach((capa, i) => mapas[i]?.removeLayer(capa));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [capas]);

    const firma = (municipios || [])
        .map(m => reparto?.asignados.get(m.clave))
        .map((a, i) => (a?.partido ? `${i}${a.lado}` : ''))
        .join('');

    useEffect(() => {
        const partidos = (municipios || [])
            .map(m => ({ municipio: m, asignacion: reparto?.asignados.get(m.clave) }))
            .filter(({ asignacion }) => asignacion?.partido);
        capas.forEach(capa => {
            const fuente = capa.getSource();
            fuente.clear(true);
            fuente.addFeatures(partidos.map(({ municipio, asignacion }) => new Feature({
                geometry: municipio.geometry.clone(),
                lado: asignacion.lado,
            })));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [capas, municipios, firma]);
};
