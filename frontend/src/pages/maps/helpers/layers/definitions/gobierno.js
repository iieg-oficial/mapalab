import { createLayerFactory } from '../utils/layerFactory';
import { createMunicipioConfig } from '../../../components/InfoBox/utils/cardTemplates';

const createGobiernoLayer = createLayerFactory('gobierno');

const FINZANZAS_MUNICIPALES = [
    ['ingreso_per_capita', 'Ingresos municipales percápita', 'ingresos_totales_reales_per_capita_precios_2023',
        ['gobierno', 'ciudadania', 'finanzas', 'economia', 'habitante', 'promedio', 'riqueza', 'pib'],
        createMunicipioConfig({
            title: 'Ingresos municipales per cápita',
            text: 'Las cifras se presentan a precios constantes de 2023',
            stats: [
                { label: 'Ingresos totales reales', field: 'ingresos_totales_reales' },
                { label: 'Ingresos totales', field: 'ingresos_totales' },
                { label: 'Ingresos reales per cápita', field: 'ingresos_reales_per_capita' },
            ]
        })],
    ['egresos_deuda_publica', 'Egresos destinados a deuda (%)', 'porcentaje_egresos_deuda_publica',
        ['gobierno', 'ciudadania', 'finanzas', 'deuda', 'pagos', 'credito', 'prestamo', 'banco', 'obligaciones'],
        createMunicipioConfig({
            title: 'Porcentaje de egresos destinado a pago de deuda pública',
            stats: [
                { label: 'Egresos totales', field: 'egresos_totales' },
                { label: 'Egresos para pago de deuda pública', field: 'egresos_para_pago_deuda_publica' },
                { label: 'Porcentaje de egresos por pago de deuda pública', field: 'porcentaje_egresos_por_pago_deuda_publica' },
            ]
        })],
    ['financiamiento', 'Ingresos por financiamiento (%)', 'porcentaje_ingresos_financiamiento',
        ['gobierno', 'ciudadania', 'finanzas', 'credito', 'deuda', 'recursos', 'presupuesto', 'ingresos'],
        createMunicipioConfig({
            title: 'Porcentaje de ingresos por concepto de financiamiento',
            stats: [
                { label: 'Ingresos totales', field: 'ingresos_totales' },
                { label: 'Ingresos por financiamiento', field: 'ingresos_por_financiamiento' },
                { label: 'Porcentaje de ingresos por financiamiento', field: 'porcentaje_de_ingresos_por_financiamiento' },
            ]
        })],
    ['ingresos_participaciones', 'Ingresos por participaciones (%)', 'porcentaje_ingresos_participaciones',
        ['gobierno', 'ciudadania', 'finanzas', 'federal', 'estatal', 'recursos', 'presupuesto', 'fondos'],
        createMunicipioConfig({
            title: 'Porcentaje de ingresos por concepto de participaciones',
            stats: [
                { label: 'Ingresos totales', field: 'ingresos_totales' },
                { label: 'Ingresos por participaciones', field: 'ingresos_por_participaciones' },
                { label: 'Porcentaje de ingresos por participaciones', field: 'porcentaje_de_ingresos_por_participaciones' },
            ]
        })],
    ['ingresos_propios', 'Ingresos propios (%)', 'ingresos_propios',
        ['gobierno', 'ciudadania', 'finanzas', 'dinero', 'recaudacion', 'impuestos', 'presupuesto', 'tesoreria'],
        createMunicipioConfig({
            title: 'Porcentaje de ingresos propios',
            stats: [
                { label: 'Ingresos totales', field: 'ingresos_totales' },
                { label: 'Ingresos propios', field: 'ingresos_propios' },
                { label: 'Porcentaje de ingresos propios', field: 'porcentaje_ingresos_propios' },
            ]
        })],
];

export const gobiernoLayers = {
    id: 'gobierno',
    label: 'Gobierno y Ciudadanía',
    children: [
        {
            id: 'finanzas_municipales',
            label: 'Finanzas municipales',
            isCategory: true,
            children: FINZANZAS_MUNICIPALES.map(([id, label, layerName, tags, littleCard]) => ({
                id,
                label,
                wmsConfig: createGobiernoLayer(layerName),
                littleCard: { ...littleCard, headerField: label },
                searchMeta: { tags }
            }))
        }
    ]
};
