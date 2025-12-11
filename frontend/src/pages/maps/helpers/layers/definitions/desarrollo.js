import { createLayerFactory } from '../utils/layerFactory';

const createDesarrolloLayer = createLayerFactory('desarrollo');

const POBREZA_VULNERABILIDADES = [
    ['pobreza', '*Pobreza', 'pobreza', ['desarrollo', 'social', 'coneval', 'ingreso', 'economica', 'marginacion', 'desigualdad', 'bienestar']],
    ['vulnerabilidad', '*Vulnerabilidad', 'vulnerabilidad', ['desarrollo', 'social', 'coneval', 'riesgo', 'ingreso', 'carencia', 'proteccion']],
    ['carencias_sociales', '*Carencias sociales y rezago educativo', 'carencias_sociales', ['desarrollo', 'social', 'educacion', 'salud', 'vivienda', 'servicios', 'alimentacion', 'analfabetismo', 'escuela']]
];

const IGUALDAD_GENERO = [
    ['brecha_salarial', '*Brecha salarial entre mujeres y hombres', 'brecha_salarial', ['desarrollo', 'social', 'genero', 'salario', 'ingreso', 'mujer', 'hombre', 'trabajo', 'remuneracion', 'equidad', 'desigualdad']],
    ['nacimientos_madres_adolescentes', '*Nacimientos de madres adolescentes', 'nacimientos_madres_adolescentes', ['desarrollo', 'social', 'genero', 'salud', 'embarazo', 'adolescente', 'maternidad', 'jovenes', 'reproductiva']],
    ['feminicidios', '*Pendiente tasas anuales de feminicidios', 'feminicidios', ['desarrollo', 'social', 'genero', 'violencia', 'seguridad', 'delito', 'mujer', 'justicia', 'crimen']]
];

export const desarrolloLayers = {
    id: 'desarrollo',
    label: 'Desarrollo Social',
    children: [
        {
            id: 'pobreza_y_vulnerabilidades',
            label: 'Pobreza y vulnerabilidades',
            base: 'iieg',
            children: POBREZA_VULNERABILIDADES.map(([id, label, layerName, tags]) => ({
                id,
                label,
                wmsConfig: createDesarrolloLayer(layerName),
                searchMeta: {
                    hasMunicipio: true,
                    hasDireccion: false,
                    searchableFields: [],
                    tags
                }
            }))
        }, {
            id: 'igualdad_de_genero',
            label: 'Igualdad de género',
            base: 'iieg',
            children: IGUALDAD_GENERO.map(([id, label, layerName, tags]) => ({
                id,
                label,
                wmsConfig: createDesarrolloLayer(layerName),
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
