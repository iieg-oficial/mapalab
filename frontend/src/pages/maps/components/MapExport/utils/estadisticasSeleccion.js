import { getArea, getLength } from 'ol/sphere';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { formatAreaValue, formatLengthValue } from '@pages/maps/helpers/formatMeasure';

export const MAX_CAPAS_SELECCION = 6;

const conDecimales = (valor, decimales = 2) => formatNumber(valor.toFixed(decimales));

export const medidasDeSeleccion = (geometria) => ({
    areaKm2: getArea(geometria, { projection: 'EPSG:3857' }) / 1e6,
    perimetroKm: getLength(geometria, { projection: 'EPSG:3857' }) / 1000,
});

const filasDeClases = ({ clases, otras }) => [
    ...clases.map(({ clase, conteo }) => ({ etiqueta: clase, valor: formatNumber(conteo), sangria: true })),
    ...(otras > 0 ? [{ etiqueta: 'Otras', valor: formatNumber(otras), sangria: true }] : []),
];

const filasDeAgregado = (agregado) => {
    if (!agregado?.datos) return [];
    if (Array.isArray(agregado.datos.clases)) return filasDeClases(agregado.datos);
    const { suma, promedio, proporcional } = agregado.datos;
    return [
        suma == null ? null : { etiqueta: `${agregado.etiqueta}, suma`, valor: conDecimales(suma), sangria: true },
        promedio == null ? null : { etiqueta: `${agregado.etiqueta}, promedio`, valor: conDecimales(promedio), sangria: true },
        proporcional == null ? null : { etiqueta: `${agregado.etiqueta}, suma por área`, valor: conDecimales(proporcional), sangria: true },
    ].filter(Boolean);
};

export const filasSeleccion = ({ areaKm2 = 0, perimetroKm = 0, capas = [], agregados = [], unidades = {} }) => [
    { etiqueta: 'Área', valor: formatAreaValue(areaKm2 * 1e6, unidades.areaUnit || 'km2') },
    { etiqueta: 'Perímetro', valor: formatLengthValue(perimetroKm * 1000, unidades.lengthUnit || 'km') },
    ...capas.slice(0, MAX_CAPAS_SELECCION).flatMap(({ id, etiqueta, conteo, sinWfs, enBorde }) => [
        {
            etiqueta,
            valor: conteo == null ? (sinWfs ? 'No aplica' : 'Sin dato') : formatNumber(conteo),
            detalle: conteo == null || areaKm2 <= 0 ? null : `${conDecimales(conteo / areaKm2)} / km²`,
        },
        ...(enBorde ? [{ etiqueta: 'Cruzan el borde, sin contar', valor: formatNumber(enBorde), sangria: true }] : []),
        ...filasDeAgregado(agregados.find(a => a.id === id)),
    ]),
];
