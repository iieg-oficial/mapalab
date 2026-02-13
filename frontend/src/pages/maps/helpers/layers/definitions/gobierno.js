import { createLayerFactory } from '../utils/layerFactory';

const createGobiernoLayer = createLayerFactory('gobierno');

const FINZANZAS_MUNICIPALES = [
    ['ingreso_per_capita', 'Ingresos municipales percápita', 'ingresos_totales_reales_per_capita_precios_2023', ['gobierno', 'ciudadania', 'finanzas', 'economia', 'habitante', 'promedio', 'riqueza', 'pib']],
    ['egresos_deuda_publica', 'Egresos destinados a deuda (%)', 'porcentaje_egresos_deuda_publica', ['gobierno', 'ciudadania', 'finanzas', 'deuda', 'pagos', 'credito', 'prestamo', 'banco', 'obligaciones']],
    ['financiamiento', 'Ingresos por financiamiento (%)', 'porcentaje_ingresos_financiamiento', ['gobierno', 'ciudadania', 'finanzas', 'credito', 'deuda', 'recursos', 'presupuesto', 'ingresos']],
    ['ingresos_participaciones', 'Ingresos por participaciones (%)', 'porcentaje_ingresos_participaciones', ['gobierno', 'ciudadania', 'finanzas', 'federal', 'estatal', 'recursos', 'presupuesto', 'fondos']],
    ['ingresos_propios', 'Ingresos propios (%)', 'porcentaje_ingresos_propios', ['gobierno', 'ciudadania', 'finanzas', 'dinero', 'recaudacion', 'impuestos', 'presupuesto', 'tesoreria']],
];

export const gobiernoLayers = {
    id: 'gobierno',
    label: 'Gobierno y Ciudadanía',
    children: [
        {
            id: 'finanzas_municipales',
            label: 'Finanzas municipales',
            isCategory: true,
            children: FINZANZAS_MUNICIPALES.map(([id, label, layerName, tags]) => ({
                id,
                label,
                wmsConfig: createGobiernoLayer(layerName),
                searchMeta: { tags }
            }))
        }
    ]
};
