import { createLayerFactory } from '../utils/layerFactory';

const createDesarrolloLayer = createLayerFactory('desarrollo');

const POBREZA_VULNERABILIDADES = [
    ['tasa_pobreza', 'Pobreza (%)', 'pobreza', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['tasa_pobreza_extrema', 'Pobreza extrema (%)', 'pobreza_extrema', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['tasa_pobreza_moderada', 'Pobreza moderada (%)', 'pobreza_moderada', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['tasa_vulnerables_por_carencia_social', 'Vulnerables por carencia social (%)', 'vulnerables_por_carencia_social', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['tasa_vulnerables_por_ingreso', 'Vulnerables por ingreso (%)', 'vulnerables_por_ingreso', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['tasa_sin_pobreza_ni_vulnerabilidades', 'Sin pobreza ni vulnerabilidades (%)', 'no_pobre_y_no_vulnerable', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['tasa_carencia_acceso_alimentacion', 'Carencia por acceso a la alimentacion (%)', 'carencia_acceso_alimentacion', ['desarrollo', 'social', 'alimentacion', 'nutricion', 'ingreso', 'carencia', 'proteccion']],
    ['tasa_carencia_acceso_servicios_basicos_vivienda', 'Carencia por acceso a servicios basicos en la vivienda (%)', 'carencia_servicios_basicos_vivienda', ['desarrollo', 'social', 'vivienda', 'servicios_basicos', 'ingreso', 'carencia', 'proteccion']],
    ['tasa_carencia_acceso_servicios_salud', 'Carencia por acceso a los servicios de salud (%)', 'carencia_acceso_servicios_salud', ['desarrollo', 'social', 'salud', 'servicios_salud', 'ingreso', 'carencia', 'proteccion']],
    ['tasa_carencia_acceso_seguridad_social', 'Carencia por acceso a la seguridad social (%)', 'carencia_acceso_seguridad_social', ['desarrollo', 'social', 'seguridad_social', 'ingreso', 'carencia', 'proteccion']],
    ['tasa_rezago_educativo', 'Rezago educativo (%)', 'rezago_educativo', ['desarrollo', 'social', 'educacion', 'rezago_educativo', 'ingreso', 'carencia', 'proteccion']],
    ['tasa_poblacion_con_al_menos_una_carencia_social', 'Población con al menos una carencia social (%)', 'poblacion_con_al_menos_una_carencia_social', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['tasa_poblacion_con_tres_o_mas_carencias_sociales', 'Población con tres o mas carencias sociales (%)', 'poblacion_con_tres_o_mas_carencias_sociales', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['tasa_poblacion_ingreso_inferior_linea_pobreza_ingresos', 'Población con ingreso inferior a la linea de pobreza por ingresos (%)', 'poblacion_ingreso_inferior_linea_pobreza_ingresos', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
    ['tasa_poblacion_ingreso_inferior_linea_pobreza_extrema_ingresos', 'Población con ingreso inferior a la linea de pobreza extrema por ingresos (%)', 'poblacion_ingreso_inferior_linea_pobreza_extrema_ingresos', ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion']],
];

const IGUALDAD_GENERO = [
    ['tasa_feminicidios_anual', 'Feminicidios (tasa anual)', 'feminicidios', ['desarrollo', 'social', 'feminicidios', 'genero', 'violencia', 'seguridad', 'delito', 'mujer', 'justicia', 'crimen']],
    ['brecha_salarial', 'Brecha salarial entre mujeres y hombres', 'brecha_salarial', ['desarrollo', 'social', 'genero', 'salario', 'ingreso', 'mujer', 'hombre', 'trabajo', 'remuneracion', 'equidad', 'desigualdad']],
    ['tasa_nacimientos_madres_infantiles', 'Nacimientos de madres de 10 a 14 años (tasa)', 'nacimientos_infantiles', ['desarrollo', 'social', 'genero', 'salud', 'embarazo', 'adolescente', 'maternidad', 'jovenes', 'reproductiva']],
    ['tasa_nacimientos_madres_adolescentes', 'Nacimientos de madres de 15 a 19 años (tasa)', 'nacimientos_adolescentes', ['desarrollo', 'social', 'genero', 'salud', 'embarazo', 'adolescente', 'maternidad', 'jovenes', 'reproductiva']],
];

export const desarrolloLayers = {
    id: 'desarrollo',
    label: 'Desarrollo Social',
    children: [
        {
            id: 'pobreza_y_vulnerabilidades',
            label: 'Pobreza y vulnerabilidades',
            isCategory: true,
            children: POBREZA_VULNERABILIDADES.map(([id, label, layerName, tags]) => ({
                id,
                label,
                wmsConfig: createDesarrolloLayer(layerName),
                searchMeta: { tags }
            }))
        }, {
            id: 'igualdad_de_genero',
            label: 'Igualdad de género',
            isCategory: true,
            children: IGUALDAD_GENERO.map(([id, label, layerName, tags]) => ({
                id,
                label,
                wmsConfig: createDesarrolloLayer(layerName),
                searchMeta: { tags }
            }))
        }
    ]
};
