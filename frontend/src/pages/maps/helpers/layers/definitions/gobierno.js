import { createLayerFactory } from '../utils/layerFactory';

const createGobiernoLayer = createLayerFactory('gobierno');

const FINZANZAS_MUNICIPALES = [
    ['ingresos_propios', '*% de ingresos propios por municipio', 'ingresos_propios', ['gobierno', 'ciudadania', 'finanzas', 'dinero', 'recaudacion', 'impuestos', 'presupuesto', 'tesoreria']],
    ['ingresos_participaciones', '*% de ingresos por concepto de participaciones', 'ingresos_participaciones', ['gobierno', 'ciudadania', 'finanzas', 'federal', 'estatal', 'recursos', 'presupuesto', 'fondos']],
    ['egresos_deuda_publica', '*% de egresos destinado a pago de deuda pública', 'egresos_deuda_publica', ['gobierno', 'ciudadania', 'finanzas', 'deuda', 'pagos', 'credito', 'prestamo', 'banco', 'obligaciones']],
    ['financiamiento', '*% de financiamiento respecto a los ingresos totales', 'financiamiento', ['gobierno', 'ciudadania', 'finanzas', 'credito', 'deuda', 'recursos', 'presupuesto', 'ingresos']],
    ['ingreso_per_capita', '*Ingreso per cápita por municipio', 'ingreso_per_capita', ['gobierno', 'ciudadania', 'finanzas', 'economia', 'habitante', 'promedio', 'riqueza', 'pib']]
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
