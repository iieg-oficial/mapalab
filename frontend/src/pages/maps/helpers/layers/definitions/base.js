import { createLayerFactory } from '../utils/layerFactory';
import { cardTemplates } from '../../../components/InfoBox/utils/cardTemplates';

const createGeneralLayer = createLayerFactory('general');

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

const BASE_LAYERS = [
    ['curvas_de_nivel', 'Curvas de nivel', 'curvas_de_nivel', ['base', 'topografia', 'altitud', 'relieve', 'elevacion', 'isolineas', 'pendiente', 'terreno', 'cotas'], null],
    ['cuerpos_de_agua_50k', 'Cuerpos de agua', 'cuerpos_de_agua_50k', ['base', 'agua', 'hidrologia', 'rio', 'lago', 'presa', 'laguna', 'recursos_hidricos', 'humedal'], null],
    ['limite_municipal', 'Límite municipal', 'limite_municipal', ['base', 'limite', 'frontera', 'municipio', 'division', 'iieg', 'demarcacion', 'territorio', 'alcaldia'], null],
    ['limite_municipal_inegi', 'Límite municipal inegi', 'limite_municipal_inegi', ['base', 'limite', 'frontera', 'municipio', 'division', 'inegi', 'demarcacion', 'territorio', 'alcaldia'], null],
    ['carretera_2012', 'Carreteras', 'carretera_2012', ['base', 'carretera', 'vialidad', 'transporte', 'autopista', 'ruta', 'infraestructura', 'pavimento', 'red_vial'], carreterasCaminosConfig('Carreteras')],
    ['caminos_2012', 'Caminos', 'caminos_2012', ['base', 'camino', 'vialidad', 'transporte', 'rural', 'brecha', 'terraceria', 'sendero'], carreterasCaminosConfig('Caminos')],
    ['regiones', 'Regiones', 'regiones', ['base', 'region', 'administrativo', 'division', 'iieg', 'zona', 'distrito', 'sector'], regionesConfig],
    ['aeropuertos', 'Aeropuertos', 'aeropuertos', ['base', 'aeropuerto', 'transporte', 'comunicacion', 'aerodromo', 'pista', 'aviacion', 'helipuerto'], aeropuertosConfig],
    ['cabeceras_municipales', 'Cabeceras municipales', 'cabeceras_municipales', ['base', 'cabecera', 'municipio', 'localidad', 'poblacion', 'ciudad', 'capital', 'centro_urbano', 'asentamiento'], null],
    ['limite_iieg', 'Límite IIEG', 'limite_iieg', ['base', 'limite', 'frontera', 'estado', 'jalisco', 'iieg', 'entidad_federativa', 'marco_geoestadistico', 'contorno'], null],
    ['limite_inegi', 'Límite INEGI', 'limite_inegi', ['base', 'limite', 'frontera', 'estado', 'jalisco', 'inegi', 'entidad_federativa', 'marco_geoestadistico', 'contorno'], null],
];

export const baseLayers = {
    id: 'base_layers',
    label: 'Capas base',
    base: 'iieg',
    hasPeriodicity: false,
    children: BASE_LAYERS.map(([id, label, param3, tags, littleCard]) => {
        let wmsGroup = 'default';
        if (id.includes('inegi')) {
            wmsGroup = 'inegi';
        } else if (['limite_iieg', 'limite_municipal', 'regiones'].includes(id)) {
            wmsGroup = 'iieg';
        }

        const wfsAvailable = !['limite_iieg', 'limite_inegi'].includes(id);
        const hiddenInMenu = ['limite_iieg', 'limite_inegi', 'limite_municipal', 'limite_municipal_inegi', 'regiones'].includes(id);

        return {
            id,
            label,
            hiddenInMenu,
            hasPeriodicity: false,
            wmsConfig: {
                ...createGeneralLayer(param3),
                wmsGroup,
                wfsAvailable
            },
            littleCard,
            searchMeta: {
                hasMunicipio: false,
                hasDireccion: false,
                searchableFields: [],
                tags
            }
        };
    })
};
