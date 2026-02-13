import { createLayerFactory } from '../utils/layerFactory';
import { cardTemplates } from '../../../components/InfoBox/utils/cardTemplates';
import { RASTER_YEAR, RASTER_TAGS, buildMonthlyTime } from '../utils/rasterHelpers';

const createRecursosLayer = createLayerFactory('recursos');
const createRasterLayer = createLayerFactory('raster');

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

const CLIMA_RASTER = [
    ['temperatura_media_mensual', 'Temperatura media mensual', 'temperaturas', RASTER_TAGS],
    ['temperatura_media_anual', 'Temperatura media promedio', `temperatura_media_anual_${RASTER_YEAR}_promedio`, RASTER_TAGS],
    ['precipitacion_mensual', 'Precipitación mensual', 'precipitacion', RASTER_TAGS],
    ['precipitacion_anual', 'Precipitación acumulada', `lluvia_anual_${RASTER_YEAR}`, RASTER_TAGS],
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
    ['bosque_de_la_primavera', 'Bosque de la Primavera', 'area_de_proteccion_bosque_la_primavera', ['recursos', 'ambiente', 'primavera', 'bosque', 'conservacion', 'limites']],
    ['agave_primavera', 'Agave dentro del APFyF La Primavera', 'agave_en_area_de_proteccion_de_flora_y_fauna_bosque_la_primaver', ['recursos', 'ambiente', 'primavera', 'cultivo', 'agave', 'conservacion', 'impacto']],
    ['parcelas_primavera', 'Parcelas dentro del APFyF La Primavera', 'parcelas_dentro_de_anp_bosque_de_la_primavera', ['recursos', 'ambiente', 'primavera', 'propiedad', 'tierra', 'conservacion', 'limites']],
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
                        littleCard: recursosConfig('nombre_espacio'),
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
                    rasterPeriodicity: isMonthly ? buildMonthlyTime([RASTER_YEAR - 1]) : undefined,
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
                        littleCard: recursosConfig('nombre_acuifero'),
                        searchMeta: { tags }
                    }))
                },
            ]
        }, {
            id: 'areas_naturales_protegidas',
            label: 'Áreas Protegidas',
            isCategory: true,
            children: [
                ...AREAS_NATURALES.map(([id, label, layerName, tags]) => ({
                    id,
                    label,
                    wmsConfig: createRecursosLayer(layerName),
                    littleCard: primaveraConfig(label),
                    searchMeta: { tags }
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
                    littleCard: recursosConfig('Uso de suelo'),
                    searchMeta: { tags }
                }))
            }
            ]
        }
    ]
};
