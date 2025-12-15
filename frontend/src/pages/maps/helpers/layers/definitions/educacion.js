import { createLayerFactory } from '../utils/layerFactory';

const createEducacionLayer = createLayerFactory('educacion');

const escuelasConfig = {
    headerField: 'nombre_escuela',
    labels: ['nivel_educativo', 'control'],
    labelGroups: [
        { fields: ['municipio', 'localidad'] }
    ],
    list: [
        { label: 'Turno', field: 'nombre_turno' },
        { label: 'Sector', field: 'sector' },
        { label: 'Año de la información', field: '' },
    ],
    iconText: { icon: 'location', field: 'domicilio' },
    cards: [
        { label: 'Total de personal', field: 'total_personal' },
        { label: 'Total de alumnos', field: 'total_alumnos' },
    ],
};

const NIVELES = [
    ['preescolar', 'Preescolar', 'preescolar', ['educacion', 'escuela', 'kinder', 'jardin', 'infantil', 'niños', 'preescolar', 'inicial']],
    ['primaria', 'Primaria', 'primaria', ['educacion', 'escuela', 'primaria', 'basica', 'niños', 'elemental', 'primer_grado']],
    ['secundaria', 'Secundaria', 'secundaria', ['educacion', 'escuela', 'secundaria', 'media_basica', 'adolescentes', 'telesecundaria', 'tecnica']],
    ['bachillerato', 'Bachillerato', 'Bachillerato', ['educacion', 'escuela', 'bachillerato', 'preparatoria', 'media_superior', 'prepa', 'cobaej', 'cecytej', 'conalep']],
    ['licenciaturas', 'Licenciaturas', 'Licenciatura', ['educacion', 'escuela', 'licenciatura', 'universidad', 'superior', 'carrera', 'facultad', 'campus', 'posgrado', 'maestria', 'doctorado']]
];

export const educacionLayers = {
    id: 'educacion',
    label: 'Educación',
    children: [
        {
            id: 'escuelas',
            label: 'Escuelas',
            base: 'iieg',
            children: NIVELES.map(([id, label, nivel, tags]) => ({
                id,
                label,
                wmsConfig: createEducacionLayer.withFilter('gold_centros_educativos_mapalab', `nivel_educativo ILIKE '${nivel}'`),
                littleCard: escuelasConfig,
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
