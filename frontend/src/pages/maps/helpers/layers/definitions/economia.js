import { createLayerFactory } from '../utils/layerFactory';
import { cardTemplates, createMunicipioConfig } from '../../../components/InfoBox/utils/cardTemplates';

const createEconomiaLayer = createLayerFactory('economia');

const cultivosConfig = cardTemplates.TEEC({
    title: 'Cultivo',
    caracteristica: 'prediccion'
});

const createOcupacionConfig = ({ title, text, stats }) => cardTemplates.TEEMLXEV({
    title,
    municipio: 'nombre',
    list: [{ label: 'Año del cálculo', field: 'fecha' }],
    text: [{ label: text }],
    stats
});

const CULTIVOS = [
    ['agave', 'Agave', 'Agave', ['economia', 'agricultura', 'cultivo', 'agave', 'tequila', 'mezcal', 'siembra', 'campo']],
    ['caña_de_azucar', 'Caña de Azúcar', 'Caña de azúcar', ['economia', 'agricultura', 'cultivo', 'caña', 'azucar', 'ingenio', 'siembra', 'campo']],
    ['maiz', 'Maíz', 'Maíz grano', ['economia', 'agricultura', 'cultivo', 'maiz', 'grano', 'elote', 'siembra', 'campo', 'alimento']],
    ['aguacate', 'Aguacate', 'Aguacate', ['economia', 'agricultura', 'cultivo', 'aguacate', 'fruta', 'oro_verde', 'siembra', 'campo', 'exportacion']],
    ['platano', 'Plátano', 'Plátano', ['economia', 'agricultura', 'cultivo', 'platano', 'banano', 'fruta', 'siembra', 'campo']],
    ['mango', 'Mango', 'Mango', ['economia', 'agricultura', 'cultivo', 'mango', 'fruta', 'siembra', 'campo']],
    ['citricos', 'Cítricos', 'Cítricos', ['economia', 'agricultura', 'cultivo', 'citricos', 'limon', 'naranja', 'toronja', 'fruta', 'siembra', 'campo']],
    ['otros', 'Otros', 'Otros', ['economia', 'agricultura', 'cultivo', 'otros', 'varios', 'siembra', 'campo']]
];

const OCUPACION_Y_EMPLEO_FORMAL_SUBCAPAS = [
    ['tasa_desocupacion', 'Población desocupada (%)', 'tasa_desocupacion',
        ['economia', 'empleo', 'trabajo', 'desocupacion', 'laboral', 'mercado', 'indicador'],
        createOcupacionConfig({
            title: 'Población desocupada (%)',
            text: 'Muestra el porcentaje de población desocupada respecto a la población económicamente activa, en el primer trimestre del año.',
            stats: [
                { label: 'Porcentaje de la población desocupada (%)', field: 'valor' },
                { label: 'Error estándar asociado (± pp)', field: 'error_estandar' },
            ]
        })],
    ['ocupacion_informal', 'Ocupación informal (%)', 'ocupacion_informal',
        ['economia', 'empleo', 'trabajo', 'informalidad', 'laboral', 'precariedad', 'sin_seguridad_social', 'indicador'],
        createOcupacionConfig({
            title: 'Ocupación informal (%)',
            text: 'Muestra el porcentaje de población en informalidad laboral respecto al total de población ocupada, en el primer trimestre del año.',
            stats: [
                { label: 'Porcentaje de ocupación informal (%)', field: 'valor' },
                { label: 'Error estándar asociado (± pp)', field: 'error_estandar' },
            ]
        })],
    ['trabajadores_asegurados', 'Trabajadores asegurados en el IMSS', 'trabajadores_asegurados',
        ['economia', 'empleo', 'trabajo', 'informalidad', 'laboral', 'precariedad', 'sin_seguridad_social', 'indicador'],
        createMunicipioConfig({
            title: 'Trabajadores asegurados en el IMSS',
            text: 'Muestra el número de personas trabajadoras aseguradas.',
            stats: [
                { label: 'Total', field: 'total' },
                { label: 'Total mujeres', field: 'total_mujeres' },
                { label: 'Total hombres', field: 'total_hombres' },
                { label: 'Total no binario', field: 'total_no_binario' },
            ]
        })],
    ['trabajadores_asegurados_mujeres', 'Mujeres entre trabajadores asegurados en el IMSS (%)', 'trabajadores_asegurados_mujeres',
        ['economia', 'empleo', 'trabajo', 'ocupacion', 'laboral', 'mercado', 'indicador'],
        createMunicipioConfig({
            title: 'Mujeres entre trabajadores asegurados en el IMSS (%)',
            text: 'Muestra el porcentaje de mujeres trabajadoras aseguradas respecto al total de personas trabajadoras aseguradas.',
            stats: [
                { label: 'Porcentaje (%)', field: 'porcentaje_mujeres' },
                { label: 'Total mujeres', field: 'total_mujeres' },
            ]
        })],
    ['trabajadores_asegurados_hombres', 'Hombres entre trabajadores asegurados en el IMSS (%)', 'trabajadores_asegurados_hombres',
        ['economia', 'empleo', 'trabajo', 'aseguramiento', 'laboral', 'precariedad', 'sin_seguridad_social', 'indicador'],
        createMunicipioConfig({
            title: 'Hombres entre trabajadores asegurados en el IMSS (%)',
            text: 'Muestra el porcentaje de hombres trabajadores asegurados en el IMSS respecto al total de personas trabajadoras aseguradas.',
            stats: [
                { label: 'Porcentaje (%)', field: 'porcentaje_hombres' },
                { label: 'Total hombres', field: 'total_hombres' },
            ]
        })],
];

export const economiaLayers = {
    id: 'economia',
    label: 'Economía',
    children: [
        {
            id: 'ocupacion_y_empleo',
            label: 'Ocupación y empleo',
            isCategory: true,
            children: OCUPACION_Y_EMPLEO_FORMAL_SUBCAPAS.map(([id, label, layerName, tags, littleCard]) => ({
                id,
                label,
                wmsConfig: createEconomiaLayer(layerName),
                searchMeta: { tags },
                littleCard
            }))
        }, {
            id: 'sector_primario',
            label: 'Sector Primario',
            isCategory: true,
            children: [
                {
                    id: 'cultivos',
                    label: 'Clasificador de cultivos IIEG',
                    forceGroup: true,
                    children: CULTIVOS.map(([id, label, matchValue, tags]) => ({
                        id,
                        label,
                        wmsConfig: createEconomiaLayer.withFilter('cultivos', `prediccion = '${matchValue}'`),
                        littleCard: cultivosConfig,
                        searchMeta: { tags }
                    }))
                }
            ]
        }
    ]
};
