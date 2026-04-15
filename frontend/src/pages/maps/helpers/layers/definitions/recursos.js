import { createLayerFactory } from '../utils/layerFactory';
import { RASTER_YEAR, RASTER_TAGS, buildMonthlyTime, createClimaAnnualConfig, createClimaMonthlyConfig } from '../utils/rasterHelpers';

const createRecursosLayer = createLayerFactory('recursos');
const createRasterLayer = createLayerFactory('raster');

const acuiferosConfig = {
    headerField: 'nombre_acuifero',
    labelGroups: [
        { fields: ['situacion_acuifero', 'condicion_acuifero'] }
    ],
    list: [
        { label: 'Región Hidrológica', field: 'region_hidrologica' },
    ],
    cards: [
        { label: 'Recarga media anual (hm³)', field: 'recarga_media_anual_hm3' },
        { label: 'Descarga natural comprometida (hm³)', field: 'descarga_natural_comprometida_hm3' },
        { label: 'Volumen de extracción total (hm³)', field: 'volumen_extraccion_total_hm3' },
        { label: 'Disponibilidad media (hm³)', field: 'disponibilidad_media_hm3' },
    ],
    cardsColumns: 1
};

const bosquePrimaveraConfig = {
    headerField: 'Área de Protección Bosque La Primavera',
    list: [
        { label: 'Decreto', field: 'decreto' },
        { label: 'Manejo', field: 'manejo' },
        { label: 'Municipios', field: 'municipio' },
        { label: 'Fecha del decreto', field: 'primer_decreto' },
    ],
    cards: [
        { label: 'Área del decreto (km²)', field: 'area_km2' },
        { label: 'Área del decreto (ha)', field: 'area_ha' },
    ],
    cardsColumns: 1
};

const parcelaPrimaveraConfig = (title) => ({
    headerField: title,
    labelGroups: [
        { fields: ['estatus'] }
    ],
    list: [
        { label: 'Nombre del predio', field: 'nombre' },
        { label: 'Folio', field: 'folio', raw: true },
        { label: 'Fecha de registro', field: 'fecha_registro', raw: true },
    ]
});

const usoDeSueloConfig = {
    headerField: 'Uso de suelo serie VII',
    list: [
        { label: 'Suelo', field: 'descripcion' },
        { label: 'Clave de tipo de suelo', field: 'clave' },
        { label: 'Agrupación', field: 'grupo' },
    ],
    cards: [
        { label: 'Área en hectáreas', field: 'area_ha' },
    ],
    cardsColumns: 1
};

const iturConfig = {
    headerField: 'Índice Territorial Urbano - Rural (ITUR)',
    list: [
        { label: 'Índice', field: 'resul_itur' },
        { label: 'Segmento del ITUR', field: 'segmentos' },
    ],
    cards: [
        { label: 'Tamaño de la población', field: 'poblacion_total_habitantes' },
        { label: 'Densidad de población', field: 'densidad_poblacion_por_kilometro' },
        { label: 'Distancia a localidades de más de 50 mil hab.', field: 'distancia_localidades_mas_50k_habitantes' },
        { label: 'Carencia de servicios básicos en la vivienda', field: 'carencia_servicios_vivienda' },
        { label: 'Proporción de uso productivo - vegetación', field: 'proporcion_uso_productivo_vegetacion' },
        { label: 'Uso de suelo construido', field: 'uso_suelo_construido' },
        { label: 'Condiciones de accesibilidad', field: 'condiciones_accesibilidad' },
        { label: 'Equipamiento urbano', field: 'equipamiento_urbano' },
    ],
    cardsColumns: 1
};

const espaciosConfig = {
    headerField: 'tipo',
    labelGroups: [
        { fields: ['geografico', 'ambito', 'condicion'] }
    ],
    list: [
        { label: 'Nombre del espacio', field: 'nomserv' },
    ]
};

const CLIMA_CARDS = {
    temperatura_media_anual: createClimaAnnualConfig(
        'Temperatura media anual',
        'Temperatura promedio en grados Celsius por interpolación de estaciones meteorológicas.',
        'Temperatura (°)'
    ),
    temperatura_media_mensual: createClimaMonthlyConfig(
        'Temperatura media mensual',
        'Temperatura media en grados Celsius por interpolación de estaciones meteorológicas.',
        'Temperatura (°)'
    ),
    precipitacion_anual: createClimaAnnualConfig(
        'Precipitación total anual',
        null,
        'Precipitación total (mm)'
    ),
    precipitacion_mensual: createClimaMonthlyConfig(
        'Precipitación total mensual',
        null,
        'Precipitación total (mm)'
    ),
};

const CLIMA_RASTER = [
    ['temperatura_media_mensual', 'Temperatura media mensual', 'temperaturas', RASTER_TAGS],
    ['temperatura_media_anual', 'Temperatura media anual', `temperatura_media_anual_${RASTER_YEAR}_promedio`, RASTER_TAGS],
    ['precipitacion_mensual', 'Precipitación mensual', 'precipitacion', RASTER_TAGS],
    ['precipitacion_anual', 'Precipitación total anual', `lluvia_anual_${RASTER_YEAR}`, RASTER_TAGS],
];

const ESPACIOS_PUBLICOS = [
    ['centro_comercial', 'Centro comercial', 'Centro Comercial', ['recursos', 'espacios_publicos', 'parques', 'jardines', 'recreacion', 'ocio']],
    ['instalacion_de_servicios', 'Instalación de servicios', 'Instalación de Servicios', ['recursos', 'espacios_publicos', 'plazas', 'plazuelas', 'recreacion', 'ocio']],
    ['instalacion_deportiva_o_recreativa', 'Instalación deportiva o recreativa', 'Instalación Deportiva o Recreativa', ['recursos', 'espacios_publicos', 'andadores', 'paseos', 'recreacion', 'ocio']],
    ['instalacion_gubernamental', 'Instalación gubernamental', 'Instalación Gubernamental', ['recursos', 'espacios_publicos', 'plataformas', 'miradores', 'recreacion', 'ocio']],
    ['mercado', 'Mercado', 'Mercado', ['recursos', 'espacios_publicos', 'fuentes', 'monumentos', 'recreacion', 'ocio']],
    ['plaza', 'Plaza', 'Plaza', ['recursos', 'espacios_publicos', 'otros', 'recreacion', 'ocio']],
];

const AGUA = [
    ['con_disponibilidad', 'Con disponibilidad', 'Con Disponibilidad', ['recursos', 'agua', 'acuifero', 'subsuelo', 'fuente']],
    ['sin_disponibilidad', 'Sin disponibilidad', 'Sin Disponibilidad', ['recursos', 'agua', 'acuifero', 'subsuelo', 'fuente']],
];

const AREAS_NATURALES = [
    ['anp_jalisco', 'Áreas Naturales Protegidas', 'areas_naturales_protegidas', ['recursos', 'ambiente', 'area_natural', 'protegida', 'conservacion', 'biodiversidad', 'reserva', 'parque', 'santuario'], bosquePrimaveraConfig],
    ['bosque_de_la_primavera', 'Bosque de la Primavera', 'area_de_proteccion_bosque_la_primavera', ['recursos', 'ambiente', 'primavera', 'bosque', 'conservacion', 'limites'], bosquePrimaveraConfig],
    ['agave_primavera', 'Agave dentro del APFyF La Primavera', 'agave_en_area_de_proteccion_de_flora_y_fauna_bosque_la_primaver', ['recursos', 'ambiente', 'primavera', 'cultivo', 'agave', 'conservacion', 'impacto'], parcelaPrimaveraConfig('Agave dentro del Área de Protección de Flora y Fauna La Primavera'), { hidePeriodicity: true }],
    ['parcelas_primavera', 'Parcelas dentro del APFyF La Primavera', 'parcelas_dentro_de_anp_bosque_de_la_primavera', ['recursos', 'ambiente', 'primavera', 'propiedad', 'tierra', 'conservacion', 'limites'], parcelaPrimaveraConfig('Parcela dentro del Área de Protección de Flora y Fauna La Primavera'), { hidePeriodicity: true }],
];

const ITUR = [
    ['urbano', 'Urbano', 'Urbano', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
    ['urbano_transitorio', 'Urbano transitorio', 'Urbano transitorio', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
    ['transicion', 'Transición', 'Transición', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
    ['rural_transitorio', 'Rural transitorio', 'Rural transitorio', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
    ['rural', 'Rural', 'Rural', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
];

const USOS_DE_SUELO = [
    ['agricultura', 'Agricultura', 'Agricultura', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
    ['asentamiento_humano', 'Asentamiento humano', 'Asentamiento humano', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
    ['bosque', 'Bosque', 'Bosque', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
    ['cuerpo_de_agua', 'Cuerpo de agua', 'Cuerpo de agua', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
    ['otros_tipos_de_vegetacion', 'Otros tipos de vegetación', 'Otros tipos de vegetación', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
    ['pastizal', 'Pastizal', 'Pastizal', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
    ['selva', 'Selva', 'Selva', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
    ['sin_vegetacion_aparente', 'Sin vegetación aparente', 'Sin vegetación aparente', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
];

export const recursosLayers = {
    id: 'recursos',
    label: 'Recursos y calidad de vida',
    children: [
        {
            id: 'asentamientos_humanos',
            label: 'Asentamientos humanos',
            isCategory: true,
            children: [
                {
                    id: 'espacios_publicos_y_lugares_recreativos',
                    label: 'Espacios públicos y lugares recreativos',
                    forceGroup: true,
                    children: ESPACIOS_PUBLICOS.map(([id, label, matchValue, tags]) => ({
                        id,
                        label,
                        wmsConfig: {
                            ...createRecursosLayer.withFilter('espacios_publicos_y_lugares_recreativos', `geografico = '${matchValue}'`),
                            wmsGroup: 'recursos',
                            wfsAvailable: true
                        },
                        littleCard: espaciosConfig,
                        searchMeta: { tags }
                    }))
                },
            ]
        }, {
            id: 'clima',
            label: 'Clima',
            isCategory: true,
            children: CLIMA_RASTER.map(([id, label, layerName, tags]) => {
                const isMonthly = id.includes('mensual');
                const isTemp = id.includes('temperatura');
                const isPrecip = id.includes('precipitacion');

                const wmsOptions = {
                    wmsGroup: isMonthly
                        ? (isTemp ? 'temp_mensual' : 'precip_mensual')
                        : (isTemp ? 'temp_anual' : 'precip_anual')
                };

                if (isMonthly) {
                    wmsOptions.timeEnabled = true;
                    if (isPrecip) {
                        wmsOptions.timeStylePattern = 'lluvia_total_mensual_{year}_{month}';
                    }
                }

                return {
                    id,
                    label,
                    wmsConfig: createRasterLayer(layerName, wmsOptions),
                    rasterPeriodicity: isMonthly ? buildMonthlyTime([RASTER_YEAR]) : undefined,
                    littleCard: CLIMA_CARDS[id],
                    searchMeta: { tags }
                };
            })
        }, {
            id: 'agua',
            label: 'Agua',
            isCategory: true,
            children: [
                {
                    id: 'disponibilidad_acuiferos',
                    label: 'Disponibilidad de acuíferos',
                    forceGroup: true,
                    children: AGUA.map(([id, label, matchValue, tags]) => ({
                        id,
                        label,
                        wmsConfig: {
                            ...createRecursosLayer.withFilter('disponibilidad_acuiferos_2023', `situacion_acuifero = '${matchValue}'`),
                            wmsGroup: 'recursos',
                            wfsAvailable: true
                        },
                        littleCard: acuiferosConfig,
                        searchMeta: { tags }
                    }))
                },
            ]
        }, {
            id: 'areas_naturales_protegidas',
            label: 'Áreas Protegidas',
            isCategory: true,
            children: [
                ...AREAS_NATURALES.map(([id, label, layerName, tags, littleCard, extraProps]) => ({
                    id,
                    label,
                    wmsConfig: createRecursosLayer(layerName),
                    littleCard,
                    searchMeta: { tags },
                    ...extraProps
                }))]
        }, {
            id: 'territorio',
            label: 'Territorio',
            isCategory: true,
            children: [{
                id: 'itur_iieg',
                label: 'Índice Territorial Urbano - Rural (ITUR)',
                forceGroup: true,
                children: ITUR.map(([id, label, matchValue, tags]) => ({
                    id,
                    label,
                    wmsConfig: {
                        ...createRecursosLayer.withFilter('itur_iieg', `segmentos = '${matchValue}'`),
                        wmsGroup: 'recursos',
                        wfsAvailable: true
                    },
                    littleCard: iturConfig,
                    searchMeta: { tags }
                }))
            }, {
                id: 'uso_de_suelo_serie_7',
                label: 'Usos de suelo serie VII',
                forceGroup: true,
                children: USOS_DE_SUELO.map(([id, label, matchValue, tags]) => ({
                    id,
                    label,
                    wmsConfig: {
                        ...createRecursosLayer.withFilter('uso_de_suelo_serie_7', `grupo = '${matchValue}'`),
                        wmsGroup: 'recursos',
                        wfsAvailable: true
                    },
                    littleCard: usoDeSueloConfig,
                    searchMeta: { tags }
                }))
            }
            ]
        }
    ]
};
