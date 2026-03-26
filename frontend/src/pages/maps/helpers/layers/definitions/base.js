import { createLayerFactory } from '../utils/layerFactory';
import { cardTemplates } from '../../../components/InfoBox/utils/cardTemplates';

const createGeneralLayer = createLayerFactory('general');

const cabecerasMunicipalesConfig = cardTemplates.TEEC({
    title: 'nombre',
    staticLabel: 'Cabecera Municipal',
});

const aeropuertosConfig = cardTemplates.TDEMEC({
    title: 'nombre',
    municipio: 'ciudad',
    caracteristica: 'tipo',
});

const caminosConfig = {
    headerField: 'Camino',
    labelGroups: [
        { fields: ['administracion'] },
        { fields: ['tipo_material'] }
    ],
    list: [
        { label: 'Origen', field: 'origen' },
        { label: 'Destino', field: 'destino' },
        { label: 'Fecha de la capa', field: 'fecha' },
    ],
    cards: [
        { label: 'Extensión (km)', field: 'largo_km' },
    ],
    cardsColumns: 1
};

const carreterasConfig = {
    headerField: 'codigo',
    labelGroups: [
        { fields: ['administracion', 'transito', 'pavimento'] }
    ],
    list: [
        { label: 'Origen', field: 'origen' },
        { label: 'Destino', field: 'destino' },
        { label: 'Fecha de la capa', field: 'fecha' },
    ],
    cards: [
        { label: 'Cantidad de carriles', field: 'carriles' },
        { label: 'Extensión (km)', field: 'largo_km' },
    ],
    cardsColumns: 1
};

const cuerposAguaConfig = cardTemplates.TEEC({
    title: 'nombre',
    caracteristica: ['condicion', 'tipo']
});

const ETIQUETA_LABELS = {
    'L í m i t e    I I E G': 'Límite estatal IIEG',
    'L í m i t e    I N E G I': 'Límite estatal INEGI',
};

const limiteEstatalConfig = {
    headerField: 'etiqueta',
    headerTransform: (value, featureId) => {
        const label = ETIQUETA_LABELS[value] || value;
        const suffix = featureId?.includes('secundario') ? '(Trasera)' : '(Frontal)';
        return `${label} ${suffix}`;
    },
    cards: [
        { label: 'Área (km²)', field: 'area_km2' },
        { label: 'Área (ha)', field: 'area_ha' },
    ],
    cardsColumns: 1
};

const limiteMunicipalConfig = (title) => ({
    headerField: title,
    labelGroups: [
        { fields: ['nombre', 'region'] }
    ],
    list: [{ label: 'Clave geográfica', field: 'clave_geo' }],
    cards: [
        { label: 'Área (km²)', field: 'area_km2' },
        { label: 'Área (ha)', field: 'area_ha' },
    ],
    cardsColumns: 1
});

const regionesConfig = {
    headerField: 'region',
    labelGroups: [
        { fields: ['municipios'], splitValues: true, colorIndex: 0 }
    ],
    cards: [
        { label: 'Área (km²)', field: 'area_km2' },
    ],
    cardsColumns: 1
};

const MEDIO_FISICO = [
    ['cuerpos_de_agua_50k', 'Cuerpos de agua', 'cuerpos_de_agua_50k', ['base', 'agua', 'hidrologia', 'rio', 'lago', 'presa', 'laguna', 'recursos_hidricos', 'humedal'], cuerposAguaConfig],
];

const INFRAESTRUCTURA = [
    ['cabeceras_municipales', 'Cabeceras municipales', 'cabeceras_municipales', ['base', 'cabecera', 'municipio', 'localidad', 'poblacion', 'ciudad', 'capital', 'centro_urbano', 'asentamiento'], cabecerasMunicipalesConfig],
];

const CARRETERAS = [
    ['carretera_libre', 'Libres', 'Libre', 'carretera_2012', ['base', 'carretera', 'vialidad', 'transporte', 'autopista', 'ruta', 'infraestructura', 'pavimento', 'red_vial', 'libre'], carreterasConfig],
    ['carretera_cuota', 'Cuota', 'Cuota', 'carretera_2012', ['base', 'carretera', 'vialidad', 'transporte', 'autopista', 'ruta', 'infraestructura', 'pavimento', 'red_vial', 'cuota'], carreterasConfig],
];

const AEROPUERTOS = [
    ['aeropuerto_internacional', 'Internacional', 'Aeropuerto Internacional', 'aeropuertos', ['base', 'aeropuerto', 'transporte', 'comunicacion', 'aerodromo', 'pista', 'aviacion', 'helipuerto', 'internacional'], aeropuertosConfig],
    ['base_aerea', 'Base Aérea', 'Base Aérea', 'aeropuertos', ['base', 'aeropuerto', 'transporte', 'comunicacion', 'aerodromo', 'pista', 'aviacion', 'helipuerto', 'base_aerea'], aeropuertosConfig],
    ['aerodromo', 'Aeródromo', 'Aeródromo', 'aeropuertos', ['base', 'aeropuerto', 'transporte', 'comunicacion', 'aerodromo', 'pista', 'aviacion', 'helipuerto', 'aerodromo'], aeropuertosConfig],
];

const HIDDEN_LAYERS = [
    ['limite_municipal', 'Límites municipales administrativos IIEG', 'limite_municipal', ['base', 'limite', 'frontera', 'municipio', 'division', 'iieg', 'demarcacion', 'territorio', 'alcaldia'], limiteMunicipalConfig('Límites municipales administrativos IIEG')],
    ['limite_municipal_inegi', 'Límites geoestadísticos municipales INEGI', 'limite_municipal_inegi', ['base', 'limite', 'frontera', 'municipio', 'division', 'inegi', 'demarcacion', 'territorio', 'alcaldia'], limiteMunicipalConfig('Límites geoestadísticos municipales INEGI')],
    ['regiones', 'Regiones del estado', 'regiones', ['base', 'region', 'administrativo', 'division', 'iieg', 'zona', 'distrito', 'sector'], regionesConfig],
    ['limite_iieg', 'Límites estatales IIEG', 'limite_iieg', ['base', 'limite', 'frontera', 'estado', 'jalisco', 'iieg', 'entidad_federativa', 'marco_geoestadistico', 'contorno'], limiteEstatalConfig, 'limite_estatal'],
    ['limite_inegi', 'Límites estatales INEGI', 'limite_inegi', ['base', 'limite', 'frontera', 'estado', 'jalisco', 'inegi', 'entidad_federativa', 'marco_geoestadistico', 'contorno'], limiteEstatalConfig, 'limite_estatal_inegi'],
    ['curvas_de_nivel', 'Curvas de nivel', 'curvas_de_nivel', ['base', 'topografia', 'altitud', 'relieve', 'elevacion', 'isolineas', 'pendiente', 'terreno', 'cotas'], null],
    ['caminos_2012', 'Red de Caminos', 'caminos_2012', ['base', 'camino', 'vialidad', 'transporte', 'rural', 'brecha', 'terraceria', 'sendero'], caminosConfig],
];

const mapGeneralLayer = ([id, label, layerName, tags, littleCard]) => ({
    id,
    label,
    wmsConfig: {
        ...createGeneralLayer(layerName),
        wmsGroup: id,
        wfsAvailable: true
    },
    littleCard,
    searchMeta: { tags }
});

const mapHiddenLayer = ([id, label, layerName, tags, littleCard, wfsLayerName]) => {
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
            wfsAvailable: true,
            ...(wfsLayerName && { wfsLayerName: `general:${wfsLayerName}` })
        },
        littleCard,
        searchMeta: { tags }
    };
};

export const BASE_INITIAL_ORDER = [
    'limite_iieg',
    'regiones',
    'limite_municipal',
    'cabeceras_municipales',
    'cuerpos_de_agua_50k',
    'curvas_de_nivel',
];

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
                    label: 'Atlas de carreteras',
                    forceGroup: true,
                    hiddenInMenu: true,
                    children: CARRETERAS.map(([id, label, matchValue, layerName, tags, littleCard]) => ({
                        id,
                        label,
                        wmsConfig: {
                            ...createGeneralLayer.withFilter(layerName, `transito = '${matchValue}'`),
                            wmsGroup: 'carreteras',
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
                            wmsGroup: 'aeropuertos',
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
