import { createLayerFactory } from '../utils/layerFactory';
import { createMunicipioConfig } from '../../../components/InfoBox/utils/cardTemplates';

const createDesarrolloLayer = createLayerFactory('desarrollo');

const STATS_CON_CARENCIAS = [
    { label: 'Número de personas', field: 'personas' },
    { label: 'Porcentaje', field: 'porcentaje' },
    { label: 'Carencias promedio', field: 'carencias_promedio' },
];

const STATS_SIN_CARENCIAS = [
    { label: 'Número de personas', field: 'personas' },
    { label: 'Porcentaje', field: 'porcentaje' },
];

const pobrezaText = (concepto) => `Porcentaje sobre la población total del municipio. Para la descripción de ${concepto}, ver la nota metodológica.`;

const POBREZA_VULNERABILIDADES = [
    ['tasa_pobreza', 'Pobreza (%)', 'pobreza',
        ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion'],
        'pobreza', STATS_CON_CARENCIAS],
    ['tasa_pobreza_extrema', 'Pobreza extrema (%)', 'pobreza_extrema',
        ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion'],
        'pobreza extrema', STATS_CON_CARENCIAS],
    ['tasa_pobreza_moderada', 'Pobreza moderada (%)', 'pobreza_moderada',
        ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion'],
        'pobreza moderada', STATS_CON_CARENCIAS],
    ['tasa_vulnerables_por_carencia_social', 'Vulnerables por carencia social (%)', 'vulnerables_por_carencia_social',
        ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion'],
        'vulnerables por carencia social', STATS_CON_CARENCIAS],
    ['tasa_vulnerables_por_ingreso', 'Vulnerables por ingreso (%)', 'vulnerables_por_ingreso',
        ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion'],
        'vulnerables por ingreso', STATS_SIN_CARENCIAS],
    ['tasa_sin_pobreza_ni_vulnerabilidades', 'Sin pobreza ni vulnerabilidades (%)', 'no_pobre_y_no_vulnerable',
        ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion'],
        'personas no pobres y no vulnerables', STATS_SIN_CARENCIAS],
    ['tasa_carencia_acceso_alimentacion', 'Carencia por acceso a la alimentacion (%)', 'carencia_acceso_alimentacion',
        ['desarrollo', 'social', 'alimentacion', 'nutricion', 'ingreso', 'carencia', 'proteccion'],
        'carencia por acceso a alimentación', STATS_CON_CARENCIAS],
    ['tasa_carencia_acceso_servicios_basicos_vivienda', 'Carencia por acceso a servicios basicos en la vivienda (%)', 'carencia_servicios_basicos_vivienda',
        ['desarrollo', 'social', 'vivienda', 'servicios_basicos', 'ingreso', 'carencia', 'proteccion'],
        'carencia por servicios básicos en la vivienda', STATS_CON_CARENCIAS],
    ['tasa_carencia_acceso_servicios_salud', 'Carencia por acceso a los servicios de salud (%)', 'carencia_acceso_servicios_salud',
        ['desarrollo', 'social', 'salud', 'servicios_salud', 'ingreso', 'carencia', 'proteccion'],
        'carencia por acceso a servicios de salud', STATS_CON_CARENCIAS],
    ['tasa_carencia_acceso_seguridad_social', 'Carencia por acceso a la seguridad social (%)', 'carencia_acceso_seguridad_social',
        ['desarrollo', 'social', 'seguridad_social', 'ingreso', 'carencia', 'proteccion'],
        'seguridad social', STATS_CON_CARENCIAS],
    ['tasa_rezago_educativo', 'Rezago educativo (%)', 'rezago_educativo',
        ['desarrollo', 'social', 'educacion', 'rezago_educativo', 'ingreso', 'carencia', 'proteccion'],
        'rezago educativo', STATS_CON_CARENCIAS],
    ['tasa_poblacion_con_al_menos_una_carencia_social', 'Población con al menos una carencia social (%)', 'poblacion_con_al_menos_una_carencia_social',
        ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion'],
        'carencia social', STATS_SIN_CARENCIAS],
    ['tasa_poblacion_con_tres_o_mas_carencias_sociales', 'Población con tres o mas carencias sociales (%)', 'poblacion_con_tres_o_mas_carencias_sociales',
        ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion'],
        'carencia social', STATS_CON_CARENCIAS],
    ['tasa_poblacion_ingreso_inferior_linea_pobreza_ingresos', 'Población con ingreso inferior a la linea de pobreza por ingresos (%)', 'poblacion_ingreso_inferior_linea_pobreza_ingresos',
        ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion'],
        'ingreso inferior a la línea de pobreza por ingresos', STATS_CON_CARENCIAS],
    ['tasa_poblacion_ingreso_inferior_linea_pobreza_extrema_ingresos', 'Población con ingreso inferior a la linea de pobreza extrema por ingresos (%)', 'poblacion_ingreso_inferior_linea_pobreza_extrema_ingresos',
        ['desarrollo', 'social', 'pobreza', 'vulnerabilidad', 'ingreso', 'carencia', 'proteccion'],
        'ingreso inferior a la línea de pobreza extrema por ingresos', STATS_CON_CARENCIAS],
];

const IGUALDAD_GENERO = [
    ['tasa_feminicidios_anual', 'Feminicidios (tasa anual)', 'feminicidios',
        ['desarrollo', 'social', 'feminicidios', 'genero', 'violencia', 'seguridad', 'delito', 'mujer', 'justicia', 'crimen'],
        createMunicipioConfig({
            title: 'Tasa anual de feminicidios',
            text: 'Cantidad de carpetas de investigación por el delito de feminicidio registradas en un año, por cada 100 mil habitantes.',
            stats: [
                { label: 'Tasa de feminicidios', field: 'tasa_carpetas_investigacion' },
                { label: 'Feminicidios', field: 'carpetas_investigacion' },
            ]
        })],
    ['tasa_brecha_salarial', 'Brecha salarial entre mujeres y hombres', 'brecha_salarial',
        ['desarrollo', 'social', 'genero', 'salario', 'ingreso', 'mujer', 'hombre', 'trabajo', 'remuneracion', 'equidad', 'desigualdad'],
        createMunicipioConfig({
            title: 'Brecha salarial',
            text: 'Diferencia media porcentual del salario diario de hombres y el salario diario de mujeres.',
            stats: [
                { label: 'Salario promedio mujeres', field: 'salario_promedio_diario_mujeres' },
                { label: 'Salario promedio hombres', field: 'salario_promedio_diario_hombres' },
                { label: 'Brecha salarial (%)', field: 'brecha_salarial' },
            ]
        })],
    ['tasa_nacimientos_madres_infantiles', 'Nacimientos de madres de 10 a 14 años (tasa)', 'nacimientos_infantiles',
        ['desarrollo', 'social', 'genero', 'salud', 'embarazo', 'adolescente', 'maternidad', 'jovenes', 'reproductiva'],
        createMunicipioConfig({
            title: 'Nacimientos de madres de 10 a 14 años',
            text: 'Nacimientos de madres de 10-14 años por cada 1,000 niñas de 10-14 años.',
            stats: [
                { label: 'Nacimientos', field: 'nacimientos' },
                { label: 'Tasa de fecundidad específica', field: 'tasa_fecundidad_especifica' },
                { label: 'Porcentaje con edad padre 18+ (%)', field: 'porcentaje_con_edad_mayor_18' },
            ]
        })],
    ['tasa_nacimientos_madres_adolescentes', 'Nacimientos de madres de 15 a 19 años (tasa)', 'nacimientos_adolescentes',
        ['desarrollo', 'social', 'genero', 'salud', 'embarazo', 'adolescente', 'maternidad', 'jovenes', 'reproductiva'],
        createMunicipioConfig({
            title: 'Nacimientos de madres adolescentes',
            text: 'Nacimientos de madres de 15-19 años por cada 1,000 mujeres de 15-19 años',
            stats: [
                { label: 'Nacimientos madre adolescente', field: 'nacimientos_madre_adolescente' },
                { label: 'Tasa de fecundidad adolescente', field: 'tasa_fecundidad_adolescente' },
                { label: 'Porcentaje con edad padre 25+', field: 'porcentaje_con_edad_mayor_25' },
            ]
        })],
];

export const desarrolloLayers = {
    id: 'desarrollo',
    label: 'Desarrollo Social',
    children: [
        {
            id: 'pobreza_y_vulnerabilidades',
            label: 'Pobreza y vulnerabilidades',
            isCategory: true,
            children: POBREZA_VULNERABILIDADES.map(([id, label, layerName, tags, concepto, stats]) => ({
                id,
                label,
                wmsConfig: createDesarrolloLayer(layerName),
                ...(id.startsWith('tasa_') && { defaultDate: 'latest' }),
                littleCard: createMunicipioConfig({
                    title: label,
                    text: pobrezaText(concepto),
                    stats
                }),
                searchMeta: { tags }
            }))
        }, {
            id: 'igualdad_de_genero',
            label: 'Igualdad de género',
            isCategory: true,
            children: IGUALDAD_GENERO.map(([id, label, layerName, tags, littleCard]) => ({
                id,
                label,
                wmsConfig: createDesarrolloLayer(layerName),
                ...(id.startsWith('tasa_') && { defaultDate: 'latest' }),
                littleCard,
                searchMeta: { tags }
            }))
        }
    ]
};
