import { createLayerFactory } from '../utils/layerFactory';
import { cardTemplates } from '../../../components/InfoBox/utils/cardTemplates';

const createGeneralLayer = createLayerFactory('general');

const cabecerasMunicipalesConfig = cardTemplates.TEEC({
    title: 'Cabecera Municipal',
    caracteristica: 'nombre',
});

const aeropuertosConfig = cardTemplates.TDEMECLU({
    title: 'nombre',
    municipio: 'ciudad',
    caracteristica: 'tipo',
    list: [
        { label: 'Año de la información', field: 'fecha_ultimo_movimiento' },
    ],
    ubicacion: 'domicilio'
});

const carreterasCaminosConfig = (title) => cardTemplates.TDEMLEV({
    title,
    municipio: ['administracion', 'transito', 'pavimento', 'tipo_material'],
    list: [
        { label: 'Código', field: 'codigo' },
        { label: 'Origen', field: 'origen' },
        { label: 'Destino', field: 'destino' },
        { label: 'Fecha de la capa', field: 'fecha' },
    ],
    stats: [
        { label: 'Cantidad de carriles', field: 'carriles' },
    ]
});

const regionesConfig = cardTemplates.TDEMEV({
    title: 'region',
    municipio: 'municipio',
    stats: [
        { label: 'Área', field: 'area_km2' },
    ]
});

const MEDIO_FISICO = [
    ['cuerpos_de_agua_50k', 'Cuerpos de agua', 'cuerpos_de_agua_50k', ['base', 'agua', 'hidrologia', 'rio', 'lago', 'presa', 'laguna', 'recursos_hidricos', 'humedal'], null],
];

const INFRAESTRUCTURA = [
    ['cabeceras_municipales', 'Cabeceras municipales', 'cabeceras_municipales', ['base', 'cabecera', 'municipio', 'localidad', 'poblacion', 'ciudad', 'capital', 'centro_urbano', 'asentamiento'], cabecerasMunicipalesConfig],
    ['caminos_2012', 'Red de Caminos', 'caminos_2012', ['base', 'camino', 'vialidad', 'transporte', 'rural', 'brecha', 'terraceria', 'sendero'], carreterasCaminosConfig('Caminos')],
];

const CARRETERAS = [
    ['carretera_libre', 'Libres', 'Libre', 'carretera_2012', ['base', 'carretera', 'vialidad', 'transporte', 'autopista', 'ruta', 'infraestructura', 'pavimento', 'red_vial', 'libre'], carreterasCaminosConfig('Libres')],
    ['carretera_cuota', 'Cuota', 'Cuota', 'carretera_2012', ['base', 'carretera', 'vialidad', 'transporte', 'autopista', 'ruta', 'infraestructura', 'pavimento', 'red_vial', 'cuota'], carreterasCaminosConfig('Cuota')],
];

const AEROPUERTOS = [
    ['aeropuerto_internacional', 'Internacional', 'Aeropuerto Internacional', 'aeropuertos', ['base', 'aeropuerto', 'transporte', 'comunicacion', 'aerodromo', 'pista', 'aviacion', 'helipuerto', 'internacional'], aeropuertosConfig],
    ['base_aerea', 'Base Aérea', 'Base Aérea', 'aeropuertos', ['base', 'aeropuerto', 'transporte', 'comunicacion', 'aerodromo', 'pista', 'aviacion', 'helipuerto', 'base_aerea'], aeropuertosConfig],
    ['aerodromo', 'Aeródromo', 'Aeródromo', 'aeropuertos', ['base', 'aeropuerto', 'transporte', 'comunicacion', 'aerodromo', 'pista', 'aviacion', 'helipuerto', 'aerodromo'], aeropuertosConfig],
];

const HIDDEN_LAYERS = [
    ['limite_municipal', 'Límites municipales geoestadísticos IIEG', 'limite_municipal', ['base', 'limite', 'frontera', 'municipio', 'division', 'iieg', 'demarcacion', 'territorio', 'alcaldia'], null],
    ['limite_municipal_inegi', 'Límites municipales administrativos INEGI', 'limite_municipal_inegi', ['base', 'limite', 'frontera', 'municipio', 'division', 'inegi', 'demarcacion', 'territorio', 'alcaldia'], null],
    ['regiones', 'Regiones del estado', 'regiones', ['base', 'region', 'administrativo', 'division', 'iieg', 'zona', 'distrito', 'sector'], regionesConfig],
    ['limite_iieg', 'Límites estatales IIEG', 'limite_iieg', ['base', 'limite', 'frontera', 'estado', 'jalisco', 'iieg', 'entidad_federativa', 'marco_geoestadistico', 'contorno'], null],
    ['limite_inegi', 'Límites estatales INEGI', 'limite_inegi', ['base', 'limite', 'frontera', 'estado', 'jalisco', 'inegi', 'entidad_federativa', 'marco_geoestadistico', 'contorno'], null],
    ['curvas_de_nivel', 'Curvas de nivel', 'curvas_de_nivel', ['base', 'topografia', 'altitud', 'relieve', 'elevacion', 'isolineas', 'pendiente', 'terreno', 'cotas'], null],
];

const mapGeneralLayer = ([id, label, layerName, tags, littleCard]) => ({
    id,
    label,
    wmsConfig: {
        ...createGeneralLayer(layerName),
        wmsGroup: 'default',
        wfsAvailable: true
    },
    littleCard,
    searchMeta: { tags }
});

const mapHiddenLayer = ([id, label, layerName, tags, littleCard]) => {
    let wmsGroup = 'default';
    if (id.includes('inegi')) {
        wmsGroup = 'inegi';
    } else if (['limite_iieg', 'limite_municipal', 'regiones'].includes(id)) {
        wmsGroup = 'iieg';
    }

    return {
        id,
        label,
        hiddenInMenu: true,
        wmsConfig: {
            ...createGeneralLayer(layerName),
            wmsGroup,
            wfsAvailable: !['limite_iieg', 'limite_inegi'].includes(id)
        },
        littleCard,
        searchMeta: { tags }
    };
};

export const baseLayers = {
    id: 'base_layers',
    label: 'General',
    children: [
        {
            id: 'medio_fisico',
            label: 'Medio Físico',
            isCategory: true,
            children: MEDIO_FISICO.map(mapGeneralLayer)
        },
        {
            id: 'centro_e_infraestructura',
            label: 'Centro e Infraestructura',
            isCategory: true,
            children: [
                ...INFRAESTRUCTURA.map(mapGeneralLayer),
                {
                    id: 'carreteras',
                    label: 'Altas de carreteras',
                    forceGroup: true,
                    children: CARRETERAS.map(([id, label, matchValue, layerName, tags, littleCard]) => ({
                        id,
                        label,
                        wmsConfig: {
                            ...createGeneralLayer.withFilter(layerName, `transito = '${matchValue}'`),
                            wmsGroup: 'default',
                            wfsAvailable: true
                        },
                        littleCard,
                        searchMeta: { tags }
                    }))
                },
                {
                    id: 'aeropuertos',
                    label: 'Aeropuertos',
                    forceGroup: true,
                    children: AEROPUERTOS.map(([id, label, matchValue, layerName, tags, littleCard]) => ({
                        id,
                        label,
                        wmsConfig: {
                            ...createGeneralLayer.withFilter(layerName, `tipo = '${matchValue}'`),
                            wmsGroup: 'default',
                            wfsAvailable: true
                        },
                        littleCard,
                        searchMeta: { tags }
                    }))
                }
            ]
        },
        ...HIDDEN_LAYERS.map(mapHiddenLayer)
    ]
};
