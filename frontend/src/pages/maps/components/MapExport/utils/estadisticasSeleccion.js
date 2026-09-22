import { getArea, getLength } from 'ol/sphere';
import { formatNumber } from '@pages/maps/helpers/formatNumber';

export const MAX_CAPAS_SELECCION = 6;

const conDecimales = (valor, decimales = 2) => formatNumber(valor.toFixed(decimales));

export const medidasDeSeleccion = (geometria) => ({
    areaKm2: getArea(geometria, { projection: 'EPSG:3857' }) / 1e6,
    perimetroKm: getLength(geometria, { projection: 'EPSG:3857' }) / 1000,
});

const filasDeAgregado = (agregado) => {
    if (!agregado?.datos) return [];
    const { suma, promedio } = agregado.datos;
    return [
        suma == null ? null : { etiqueta: `${agregado.etiqueta}, suma`, valor: conDecimales(suma), sangria: true },
        promedio == null ? null : { etiqueta: `${agregado.etiqueta}, promedio`, valor: conDecimales(promedio), sangria: true },
    ].filter(Boolean);
};

export const filasSeleccion = ({ areaKm2 = 0, perimetroKm = 0, capas = [], agregados = [] }) => [
    { etiqueta: 'Área', valor: `${conDecimales(areaKm2)} km²` },
    { etiqueta: 'Perímetro', valor: `${conDecimales(perimetroKm)} km` },
    ...capas.slice(0, MAX_CAPAS_SELECCION).flatMap(({ id, etiqueta, conteo }) => [
        {
            etiqueta,
            valor: conteo == null ? '—' : formatNumber(conteo),
            detalle: conteo == null || areaKm2 <= 0 ? null : `${conDecimales(conteo / areaKm2)} / km²`,
        },
        ...filasDeAgregado(agregados.find(a => a.id === id)),
    ]),
];
