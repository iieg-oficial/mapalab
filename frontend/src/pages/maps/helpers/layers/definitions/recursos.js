import { createLayerFactory } from '../utils/layerFactory';

const createRecursosLayer = createLayerFactory('recursos');
const createGeneralLayer = createLayerFactory('general');

const ESPACIOS_PUBLICOS = [
    ['espacios_publicos_y_lugares_recreativos', 'Espacios públicos y lugares recreativos', 'espacios_publicos_y_lugares_recreativos', ['recursos', 'parques', 'jardines', 'recreacion', 'aire_libre', 'esparcimiento', 'convivencia']],
    ['instalacion_deportiva', '*Instalación Deportiva o Recreativa', 'instalacion_deportiva', ['recursos', 'deporte', 'cancha', 'estadio', 'gimnasio', 'unidad_deportiva', 'ejercicio']],
    ['centro_comercial', '*Centro Comercial', 'centro_comercial', ['recursos', 'comercio', 'tiendas', 'plaza', 'compras', 'servicios', 'mercado']],
    ['instalacion_servicios', '*Instalación de Servicios', 'instalacion_servicios', ['recursos', 'servicios', 'infraestructura', 'atencion', 'publico', 'tramites']],
    ['instalacion_gubernamental', '*Instalación Gubernamental', 'instalacion_gubernamental', ['recursos', 'gobierno', 'oficinas', 'administracion', 'publico', 'tramites']],
    ['mercado', '*Mercado', 'mercado', ['recursos', 'comercio', 'abasto', 'alimentos', 'tianguis', 'venta', 'local']],
    ['plaza', '*Plaza', 'plaza', ['recursos', 'espacio_publico', 'jardin', 'centro', 'reunion', 'civico']],
];

const CLIMA = [
    ['temperatura_media', '*Temperatura media', 'temperatura_media', ['recursos', 'clima', 'calor', 'frio', 'grados', 'ambiente', 'meteorologia']],
    ['sequia', '*Sequía', 'sequia', ['recursos', 'clima', 'agua', 'lluvia', 'aridez', 'estiaje', 'meteorologia']],
    ['precipitacion', '*Precipitación', 'precipitacion', ['recursos', 'clima', 'lluvia', 'agua', 'pluvial', 'tormenta', 'meteorologia']],
];

const AREAS_NATURALES = [
    ['area_bosque_primavera', 'Decreto ANP', 'area_de_proteccion_bosque_la_primavera', ['recursos', 'ambiente', 'primavera', 'conservacion', 'proteccion', 'ecologia', 'reserva', 'parque_nacional']],
    ['agave_primavera', 'Agave en APFyF La Primavera', 'agave_en_area_de_proteccion_de_flora_y_fauna_bosque_la_primaver', ['recursos', 'ambiente', 'primavera', 'cultivo', 'agave', 'conservacion', 'impacto']],
    ['parcelas_primavera', 'Parcelas dentro del APFyF La Primavera', 'parcelas_dentro_de_anp_bosque_de_la_primavera', ['recursos', 'ambiente', 'primavera', 'propiedad', 'tierra', 'conservacion', 'limites']],
];

const USO_SUELO = [
    ['itur_iieg', 'Índice Territorial Urbano - Rural', 'itur_iieg', ['recursos', 'territorio', 'urbano', 'rural', 'clasificacion', 'poblacion', 'asentamiento']],
    ['dominancia_de_uso_de_suelo', 'Dominancia del uso de suelo', 'dominancia_de_uso_de_suelo', ['recursos', 'suelo', 'cobertura', 'vegetacion', 'urbano', 'agricola', 'forestal']]
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
            children: CLIMA.map(([id, label, layerName, tags]) => ({
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
            id: 'agua',
            label: 'Agua',
            base: 'iieg',
            children: [
                {
                    id: 'disponibilidad_acuiferos_2023',
                    label: 'Disponibilidad de acuíferos 2023',
                    wmsConfig: createRecursosLayer('disponibilidad_acuiferos_2023'),
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
                    children: AREAS_NATURALES.map(([id, label, layerName, tags]) => ({
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
            ]
        }, {
            id: 'uso_de_suelo',
            label: 'Uso de suelo',
            base: 'iieg',
            children: USO_SUELO.map(([id, label, layerName, tags]) => ({
                id,
                label,
                wmsConfig: createRecursosLayer(layerName),
                searchMeta: {
                    hasMunicipio: true,
                    hasDireccion: false,
                    searchableFields: [],
                    tags
                }
            }))
        }
    ]
};
