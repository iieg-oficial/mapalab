import { createLayerFactory } from '../utils/layerFactory';

const createGeneralLayer = createLayerFactory('general');

const BASE_LAYERS = [
    ['curvas_de_nivel', 'Curvas de nivel', 'curvas_de_nivel', ['base', 'topografia', 'altitud', 'relieve', 'elevacion', 'isolineas', 'pendiente', 'terreno', 'cotas']],
    ['cuerpos_de_agua_250k', 'Cuerpos de agua', 'cuerpos_de_agua_250k', ['base', 'agua', 'hidrologia', 'rio', 'lago', 'presa', 'laguna', 'recursos_hidricos', 'humedal']],
    ['limite_municipal', 'Límite municipal', 'limite_municipal', ['base', 'limite', 'frontera', 'municipio', 'division', 'iieg', 'demarcacion', 'territorio', 'alcaldia']],
    ['limite_municipal_inegi', 'Límite municipal inegi', 'limite_municipal_inegi', ['base', 'limite', 'frontera', 'municipio', 'division', 'inegi', 'demarcacion', 'territorio', 'alcaldia']],
    ['carretera_2012', 'Carreteras', 'carretera_2012', ['base', 'carretera', 'vialidad', 'transporte', 'autopista', 'ruta', 'infraestructura', 'pavimento', 'red_vial']],
    ['caminos_2012', 'Caminos', 'caminos_2012', ['base', 'camino', 'vialidad', 'transporte', 'rural', 'brecha', 'terraceria', 'sendero']],
    ['regiones', 'Regiones', 'regiones', ['base', 'region', 'administrativo', 'division', 'iieg', 'zona', 'distrito', 'sector']],
    ['aeropuertos', 'Aeropuertos', 'aeropuertos', ['base', 'aeropuerto', 'transporte', 'comunicacion', 'aerodromo', 'pista', 'aviacion', 'helipuerto']],
    ['cabeceras_municipales', 'Cabeceras municipales', 'cabeceras_municipales', ['base', 'cabecera', 'municipio', 'localidad', 'poblacion', 'ciudad', 'capital', 'centro_urbano', 'asentamiento']],
    ['limite_iieg', 'Límite IIEG', 'limite_iieg', ['base', 'limite', 'frontera', 'estado', 'jalisco', 'iieg', 'entidad_federativa', 'marco_geoestadistico', 'contorno']],
    ['limite_inegi', 'Límite INEGI', 'limite_inegi', ['base', 'limite', 'frontera', 'estado', 'jalisco', 'inegi', 'entidad_federativa', 'marco_geoestadistico', 'contorno']],
];

export const baseLayers = {
    id: 'base_layers',
    label: 'Capas base',
    base: 'iieg',
    hasPeriodicity: false,
    children: BASE_LAYERS.map(([id, label, param3, tags]) => {
        let wmsGroup = 'default';
        if (id.includes('inegi')) {
            wmsGroup = 'inegi';
        } else if (['limite_iieg', 'limite_municipal', 'regiones'].includes(id)) {
            wmsGroup = 'iieg';
        }

        const wfsAvailable = !['limite_iieg', 'limite_inegi'].includes(id);

        return {
            id,
            label,
            wmsConfig: {
                ...createGeneralLayer(param3),
                wmsGroup,
                wfsAvailable
            },
            searchMeta: {
                hasMunicipio: false,
                hasDireccion: false,
                searchableFields: [],
                tags
            }
        };
    })
};
