import { createLayerFactory } from '../utils/layerFactory';
import { cardTemplates } from '../../../components/InfoBox/utils/cardTemplates';

const createRecursosLayer = createLayerFactory('recursos');
const createGeneralLayer = createLayerFactory('general');

const recursosConfig = (title) => cardTemplates.TDEMLEV({
    title,
    municipio: ['condicion', 'tipo'],
    list: [
        { label: 'Región Hidrológica', field: 'region_hidrologica' },
        { label: 'Situación', field: 'situacion_acuifero' },
        { label: 'Condición', field: 'condicion_acuifero' },
        { label: 'Suelo', field: 'descripcion' },
        { label: 'Dominancia del suelo en la selección', field: 'dominancia' },
        { label: 'Fecha de decreto', field: 'fecha_decreto' },
    ],
    stats: [
        { label: 'Recarga media anual', field: 'recarga_media_anual_hm3' },
        { label: 'Descarga natural comprometida', field: 'descarga_natural_comprometida_hm3' },
        { label: 'Volumen extracción total', field: 'volumen_extraccion_total_hm3' },
        { label: '%', field: '%' }
    ]
});

const primaveraConfig = (title) => cardTemplates.TDEMLEV({
    title,
    municipio: 'municipio',
    splitMunicipio: true,
    list: [
        { label: 'Nombre del predio', field: 'nombre' },
        { label: 'Estatus', field: 'estatus' },
        { label: 'Fecha de registro', field: 'fecha' },
        { label: 'Folio', field: 'folio' },
        { label: 'Decreto', field: 'decreto' },
        { label: 'Manejo', field: 'manejo' },
        { label: 'Fecha de decreto', field: 'primer_decreto' },
    ],
    stats: [
        { label: 'Área del decreto', field: 'area_km2' },
        { label: 'Superficie', field: 'superficie' },
    ]
});

const ESPACIOS_PUBLICOS = [
    ['espacios_publicos_y_lugares_recreativos', 'Espacios públicos y lugares recreativos', 'espacios_publicos_y_lugares_recreativos', ['recursos', 'parques', 'jardines', 'recreacion', 'aire_libre', 'esparcimiento', 'convivencia']],
    ['instalacion_deportiva', '*Instalación Deportiva o Recreativa', 'instalacion_deportiva', ['recursos', 'deporte', 'cancha', 'estadio', 'gimnasio', 'unidad_deportiva', 'ejercicio']],
    ['centro_comercial', '*Centro Comercial', 'centro_comercial', ['recursos', 'comercio', 'tiendas', 'plaza', 'compras', 'servicios', 'mercado']],
    ['instalacion_servicios', '*Instalación de Servicios', 'instalacion_servicios', ['recursos', 'servicios', 'infraestructura', 'atencion', 'publico', 'tramites']],
    ['instalacion_gubernamental', '*Instalación Gubernamental', 'instalacion_gubernamental', ['recursos', 'gobierno', 'oficinas', 'administracion', 'publico', 'tramites']],
    ['mercado', '*Mercado', 'mercado', ['recursos', 'comercio', 'abasto', 'alimentos', 'tianguis', 'venta', 'local']],
    ['plaza', '*Plaza', 'plaza', ['recursos', 'espacio_publico', 'jardin', 'centro', 'reunion', 'civico']],
];

const CLIMA_VECTOR = [
    ['sequia', '*Sequía', 'sequia', ['recursos', 'clima', 'agua', 'lluvia', 'aridez', 'estiaje', 'meteorologia']],
];

const createRasterLayer = createLayerFactory('raster');

const RASTER_YEAR = new Date().getFullYear();
const RASTER_TAGS = ['recursos', 'clima', 'calor', 'frio', 'grados', 'ambiente', 'meteorologia', 'lluvia', 'precipitacion', 'temperatura'];

const buildMonthlyTime = (years = [RASTER_YEAR]) => {
    const result = {};
    years.forEach(year => {
        result[year] = {};
        for (let m = 1; m <= 12; m++) {
            result[year][m] = `${year}-${String(m).padStart(2, '0')}-01`;
        }
    });
    return result;
};

const CLIMA_RASTER = [
    {
        id: 'temperatura_media_mensual',
        label: 'Temperatura media mensual',
        wmsConfig: createRasterLayer('temperaturas', { wmsGroup: 'temp_mensual', timeEnabled: true }),
        rasterPeriodicity: buildMonthlyTime([RASTER_YEAR - 1]),
        searchMeta: { hasMunicipio: false, hasDireccion: false, searchableFields: [], tags: RASTER_TAGS }
    },
    {
        id: 'temperatura_media_anual',
        label: 'Temperatura media promedio',
        wmsConfig: createRasterLayer(`temperatura_media_anual_${RASTER_YEAR}_promedio`, { wmsGroup: 'temp_anual' }),
        searchMeta: { hasMunicipio: false, hasDireccion: false, searchableFields: [], tags: RASTER_TAGS }
    },
    {
        id: 'precipitacion_mensual',
        label: 'Precipitación mensual',
        wmsConfig: createRasterLayer('precipitacion', { wmsGroup: 'precip_mensual', timeEnabled: true, timeStylePattern: 'lluvia_total_mensual_{year}_{month}' }),
        rasterPeriodicity: buildMonthlyTime([RASTER_YEAR - 1]),
        searchMeta: { hasMunicipio: false, hasDireccion: false, searchableFields: [], tags: RASTER_TAGS }
    },
    {
        id: 'precipitacion_anual',
        label: 'Precipitación acumulada',
        wmsConfig: createRasterLayer(`lluvia_anual_${RASTER_YEAR}`, { wmsGroup: 'precip_anual' }),
        searchMeta: { hasMunicipio: false, hasDireccion: false, searchableFields: [], tags: RASTER_TAGS }
    },
];

const AREAS_NATURALES = [
    ['area_bosque_primavera', 'Decreto ANP', 'area_de_proteccion_bosque_la_primavera', ['recursos', 'ambiente', 'primavera', 'conservacion', 'proteccion', 'ecologia', 'reserva', 'parque_nacional']],
    ['agave_primavera', 'Agave en APFyF La Primavera', 'agave_en_area_de_proteccion_de_flora_y_fauna_bosque_la_primaver', ['recursos', 'ambiente', 'primavera', 'cultivo', 'agave', 'conservacion', 'impacto']],
    ['parcelas_primavera', 'Parcelas dentro del APFyF La Primavera', 'parcelas_dentro_de_anp_bosque_de_la_primavera', ['recursos', 'ambiente', 'primavera', 'propiedad', 'tierra', 'conservacion', 'limites']],
];

const USO_SUELO = [
    ['itur_iieg', 'Índice Territorial Urbano - Rural', 'itur_iieg', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
    ['uso_de_suelo_serie_7', 'Uso de suelo serie 7', 'uso_de_suelo_serie_7', ['recursos', 'suelo', 'cobertura', 'vegetacion', 'urbano', 'agricola', 'forestal']],
];


export const recursosLayers = {
    id: 'recursos',
    label: 'Recursos y calidad de vida',
    children: [
        {
            id: 'espacios_publicos',
            label: 'Espacios públicos',
            base: 'iieg',
            children: ESPACIOS_PUBLICOS.map(([id, label, layerName, tags]) => ({
                id,
                label,
                wmsConfig: createRecursosLayer(layerName),
                searchMeta: {
                    hasMunicipio: false,
                    hasDireccion: false,
                    searchableFields: [],
                    tags
                }
            }))
        },
        {
            id: 'clima',
            label: 'Clima',
            base: 'iieg',
            children: [
                ...CLIMA_VECTOR.map(([id, label, layerName, tags]) => ({
                    id,
                    label,
                    wmsConfig: createRecursosLayer(layerName),
                    searchMeta: { hasMunicipio: false, hasDireccion: false, searchableFields: [], tags }
                })),
                ...CLIMA_RASTER
            ]
        },
        {
            id: 'agua',
            label: 'Agua',
            base: 'iieg',
            children: [
                {
                    id: 'disponibilidad_acuiferos_2023',
                    label: 'Disponibilidad de acuíferos 2023',
                    wmsConfig: createRecursosLayer('disponibilidad_acuiferos_2023'),
                    littleCard: recursosConfig('nombre_acuifero'),
                    searchMeta: {
                        hasMunicipio: false,
                        hasDireccion: false,
                        searchableFields: [],
                        tags: ['recursos', 'agua', 'acuiferos', 'disponibilidad', 'hidrologia']
                    }
                },
                {
                    id: 'cuerpos_de_agua',
                    label: 'Cuerpos de agua',
                    wmsConfig: createGeneralLayer('cuerpos_de_agua_250k'),
                    littleCard: recursosConfig('nombre'),
                    searchMeta: {
                        hasMunicipio: false,
                        hasDireccion: false,
                        searchableFields: [],
                        tags: ['recursos', 'agua', 'cuerpos', 'hidrologia', 'lagos', 'rios']
                    }
                }
            ]
        },
        {
            id: 'areas_naturales_protegidas',
            label: 'Áreas Protegidas',
            base: 'iieg',
            children: [
                {
                    id: 'bosque_de_la_primavera',
                    label: 'Bosque de la Primavera',
                    forceGroup: true,
                    children: AREAS_NATURALES.map(([id, label, layerName, tags]) => ({
                        id,
                        label,
                        wmsConfig: createRecursosLayer(layerName),
                        littleCard: primaveraConfig(label),
                        searchMeta: {
                            hasMunicipio: false,
                            hasDireccion: false,
                            searchableFields: [],
                            tags
                        }
                    }))
                },
            ]
        }, {
            id: 'uso_de_suelo',
            label: 'Uso de suelo',
            base: 'iieg',
            children: [
                ...USO_SUELO.map(([id, label, layerName, tags]) => ({
                    id,
                    label,
                    wmsConfig: createRecursosLayer(layerName),
                    littleCard: id === 'dominancia_de_uso_de_suelo' ? recursosConfig('Uso de suelo') : undefined,
                    searchMeta: {
                        hasMunicipio: true,
                        hasDireccion: false,
                        searchableFields: [],
                        tags
                    }
                })),
            ]
        }
    ]
};
