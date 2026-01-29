import { createLayerFactory } from '../utils/layerFactory';

const createGobiernoLayer = createLayerFactory('gobierno');

const FINZANZAS_MUNICIPALES = [
    ['ingresos_propios', 'Ingresos propios por municipio', 'porcentaje_ingresos_propios', ['gobierno', 'ciudadania', 'finanzas', 'dinero', 'recaudacion', 'impuestos', 'presupuesto', 'tesoreria']],
    ['ingresos_participaciones', 'Porcentaje de ingresos por concepto de participaciones', 'porcentaje_ingresos_participaciones', ['gobierno', 'ciudadania', 'finanzas', 'federal', 'estatal', 'recursos', 'presupuesto', 'fondos']],
    ['egresos_deuda_publica', 'Porcentaje de egresos destinado a pago de deuda pública', 'porcentaje_egresos_deuda_publica', ['gobierno', 'ciudadania', 'finanzas', 'deuda', 'pagos', 'credito', 'prestamo', 'banco', 'obligaciones']],
    ['financiamiento', 'Porcentaje de financiamiento respecto a los ingresos totales', 'porcentaje_ingresos_financiamiento', ['gobierno', 'ciudadania', 'finanzas', 'credito', 'deuda', 'recursos', 'presupuesto', 'ingresos']],
    ['ingreso_per_capita', 'Ingreso per cápita por municipio', 'ingresos_totales_reales_per_capita_precios_2023', ['gobierno', 'ciudadania', 'finanzas', 'economia', 'habitante', 'promedio', 'riqueza', 'pib']]
];

export const gobiernoLayers = {
    id: 'gobierno',
    label: 'Gobierno y Ciudadanía',
    children: [
        {
            id: 'finanzas_municipales',
            label: 'Finanzas municipales',
            base: 'iieg',
            children: FINZANZAS_MUNICIPALES.map(([id, label, layerName, tags]) => ({
                id,
                label,
                wmsConfig: createGobiernoLayer(layerName),
                searchMeta: {
                    hasMunicipio: true,
                    hasDireccion: false,
                    searchableFields: [],
                    tags
                }
            }))
        }
    ]
};
