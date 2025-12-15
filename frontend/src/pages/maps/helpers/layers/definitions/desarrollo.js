import { createLayerFactory } from '../utils/layerFactory';

const createDesarrolloLayer = createLayerFactory('desarrollo');

const POBREZA_VULNERABILIDADES = [
    ['pobreza', 'Pobreza', 'pobreza', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['pobreza_extrema', 'Pobreza extrema', 'pobreza_extrema', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['pobreza_moderada', 'Pobreza moderada', 'pobreza_moderada', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['vulnerables_por_carencia_social', 'Vulnerables por carencia social', 'vulnerables_por_carencia_social', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['vulnerables_por_ingreso', 'Vulnerables por ingreso', 'vulnerables_por_ingreso', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['carencia_acceso_alimentacion', 'Carencia de acceso al alimentacion', 'carencia_acceso_alimentacion', ['desarrollo', 'social', 'alimentacion', 'nutricion', 'ingreso', 'carencia', 'proteccion']],
    ['carencia_acceso_seguridad_social', 'Carencia de acceso a la seguridad social', 'carencia_acceso_seguridad_social', ['desarrollo', 'social', 'seguridad', 'ingreso', 'carencia', 'proteccion']],
    ['carencia_acceso_servicios_salud', 'Carencia de acceso a los servicios de salud', 'carencia_acceso_servicios_salud', ['desarrollo', 'social', 'salud', 'ingreso', 'carencia', 'proteccion']],
    ['carencia_calidad_espacios_vivienda', 'Carencia de calidad de los espacios de vivienda', 'carencia_calidad_espacios_vivienda', ['desarrollo', 'social', 'vivienda', 'ingreso', 'carencia', 'proteccion']],
    ['carencia_servicios_basicos_vivienda', 'Carencia de servicios basicos en vivienda', 'carencia_servicios_basicos_vivienda', ['desarrollo', 'social', 'vivienda', 'ingreso', 'carencia', 'proteccion']],
    ['rezago_educativo', 'Rezago educativo', 'rezago_educativo', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
];

const IGUALDAD_GENERO = [
    ['brecha_salarial', 'Brecha salarial entre mujeres y hombres', 'brecha_salarial', ['desarrollo', 'social', 'genero', 'salario', 'ingreso', 'mujer', 'hombre', 'trabajo', 'remuneracion', 'equidad', 'desigualdad']],
    ['nacimientos_madres_adolescentes', 'Nacimientos de madres adolescentes', 'nacimientos_adolescentes', ['desarrollo', 'social', 'genero', 'salud', 'embarazo', 'adolescente', 'maternidad', 'jovenes', 'reproductiva']],
    ['nacimientos_infantiles', 'Nacimientos infantiles', 'nacimientos_infantiles', ['desarrollo', 'social', 'genero', 'salud', 'embarazo', 'adolescente', 'maternidad', 'jovenes', 'reproductiva']],
    ['feminicidios', '*Pendiente tasas anuales de feminicidios', 'feminicidios', ['desarrollo', 'social', 'genero', 'violencia', 'seguridad', 'delito', 'mujer', 'justicia', 'crimen']]
];

const POR_DEFINIR = [
    ['no_pobre_y_no_vulnerable', 'No pobre y no vulnerable', 'no_pobre_y_no_vulnerable', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['poblacion_con_al_menos_una_carencia_social', 'Poblacion con al menos una carencia social', 'poblacion_con_al_menos_una_carencia_social', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['poblacion_con_tres_o_mas_carencias_sociales', 'Poblacion con tres o mas carencias sociales', 'poblacion_con_tres_o_mas_carencias_sociales', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['poblacion_ingreso_inferior_linea_pobreza_extrama_ingresos', 'Poblacion ingreso inferior linea pobreza extrama ingresos', 'poblacion_ingreso_inferior_linea_pobreza_extrama_ingresos', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['poblacion_ingreso_inferior_linea_pobreza_ingresos', 'Poblacion ingreso inferior linea pobreza ingresos', 'poblacion_ingreso_inferior_linea_pobreza_ingresos', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
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
        }, {
            id: 'por_definir',
            label: 'Por definir',
            base: 'iieg',
            children: POR_DEFINIR.map(([id, label, layerName, tags]) => ({
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
