import { createLayerFactory } from '../utils/layerFactory';

const createEconomiaLayer = createLayerFactory('economia');

const cultivosConfig = {
    headerField: 'Cultivo',
    labels: ['prediccion']
};

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
    ['tasa_desocupacion', 'Población desocupada (%)', 'tasa_desocupacion', ['economia', 'empleo', 'trabajo', 'desocupacion', 'laboral', 'mercado', 'indicador']],
    ['ocupacion_informal', 'Ocupación informal (%)', 'ocupacion_informal', ['economia', 'empleo', 'trabajo', 'informalidad', 'laboral', 'precariedad', 'sin_seguridad_social', 'indicador']],
    ['trabajadores_asegurados', 'Trabajadores asegurados en el IMSS', 'trabajadores_asegurados', ['economia', 'empleo', 'trabajo', 'informalidad', 'laboral', 'precariedad', 'sin_seguridad_social', 'indicador']],
    ['trabajadores_asegurados_mujeres', 'Mujeres entre trabajadores asegurados en el IMSS (%)', 'trabajadores_asegurados_mujeres', ['economia', 'empleo', 'trabajo', 'ocupacion', 'laboral', 'mercado', 'indicador']],
    ['trabajadores_asegurados_hombres', 'Hombres entre trabajadores asegurados en el IMSS (%)', 'trabajadores_asegurados_hombres', ['economia', 'empleo', 'trabajo', 'aseguramiento', 'laboral', 'precariedad', 'sin_seguridad_social', 'indicador']],
];

export const economiaLayers = {
    id: 'economia',
    label: 'Economía',
    children: [
        {
            id: 'ocupacion_y_empleo',
            label: 'Ocupación y empleo',
            isCategory: true,
            children: OCUPACION_Y_EMPLEO_FORMAL_SUBCAPAS.map(([id, label, layerName, tags]) => ({
                id,
                label,
                wmsConfig: createEconomiaLayer(layerName),
                searchMeta: {tags}
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
                        searchMeta: {tags}
                    }))
                }
            ]
        }
    ]
};
