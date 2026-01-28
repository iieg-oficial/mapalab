import { createLayerFactory } from '../utils/layerFactory';

const createEconomiaLayer = createLayerFactory('economia');

const CULTIVOS = [
    ['agave', 'Agave', 'Agave', ['economia', 'agricultura', 'cultivo', 'agave', 'tequila', 'mezcal', 'siembra', 'campo']],
    ['caña_de_azucar', 'Caña de Azúcar', 'Sugarcane', ['economia', 'agricultura', 'cultivo', 'caña', 'azucar', 'ingenio', 'siembra', 'campo']],
    ['maiz', 'Maíz', 'Corn grain', ['economia', 'agricultura', 'cultivo', 'maiz', 'grano', 'elote', 'siembra', 'campo', 'alimento']],
    ['avocado', 'Aguacate', 'Avocado', ['economia', 'agricultura', 'cultivo', 'aguacate', 'fruta', 'oro_verde', 'siembra', 'campo', 'exportacion']],
    ['banana', 'Plátano', 'Banana', ['economia', 'agricultura', 'cultivo', 'platano', 'banano', 'fruta', 'siembra', 'campo']],
    ['mango', 'Mango', 'Mango', ['economia', 'agricultura', 'cultivo', 'mango', 'fruta', 'siembra', 'campo']],
    ['citrus', 'Cítricos', 'Citrus fruits', ['economia', 'agricultura', 'cultivo', 'citricos', 'limon', 'naranja', 'toronja', 'fruta', 'siembra', 'campo']],
    ['others', 'Otros', 'Others', ['economia', 'agricultura', 'cultivo', 'otros', 'varios', 'siembra', 'campo']]
];

const OCUPACION_Y_EMPLEO_FORMAL_SUBCAPAS = [
    ['tasa_de_desempleo', '*Tasa de Desempleo', 'tasa_de_desempleo', ['economia', 'empleo', 'trabajo', 'desocupacion', 'laboral', 'mercado', 'indicador']],
    ['porcentaje_de_informalidad', '*Porcentaje de Informalidad', 'porcentaje_de_informalidad', ['economia', 'empleo', 'trabajo', 'informalidad', 'laboral', 'precariedad', 'sin_seguridad_social', 'indicador']],
    ['ocupacion_informal', 'Ocupación informal', 'ocupacion_informal', ['economia', 'empleo', 'trabajo', 'informalidad', 'laboral', 'precariedad', 'sin_seguridad_social', 'indicador']],
    ['tasa_ocupacion', 'Tasa de Ocupación', 'tasa_ocupacion', ['economia', 'empleo', 'trabajo', 'ocupacion', 'laboral', 'mercado', 'indicador']],
    ['trabajadores_asegurados', 'Trabajadores Asegurados', 'trabajadores_asegurados', ['economia', 'empleo', 'trabajo', 'aseguramiento', 'laboral', 'precariedad', 'sin_seguridad_social', 'indicador']],
];

export const economiaLayers = {
    id: 'economia',
    label: 'Economía',
    children: [
        {
            id: 'unidades_economicas',
            label: 'Unidades Ocupación y empleo formal',
            base: 'iieg',
            children: OCUPACION_Y_EMPLEO_FORMAL_SUBCAPAS.map(([id, label, layerName, tags]) => ({
                id,
                label,
                wmsConfig: createEconomiaLayer(layerName),
                searchMeta: {
                    hasMunicipio: true,
                    hasDireccion: false,
                    searchableFields: [],
                    tags
                }
            }))
        }, {
            id: 'cultivos',
            label: 'Cultivos',
            base: 'iieg',
            forceGroup: true,
            children: CULTIVOS.map(([id, label, matchValue, tags]) => ({
                id,
                label,
                wmsConfig: createEconomiaLayer.withFilter('cultivos', `ai_preds = '${matchValue}'`),
                searchMeta: {
                    hasMunicipio: false,
                    hasDireccion: false,
                    searchableFields: [],
                    tags
                }
            }))
        }
    ]
};
