import { createLayerFactory } from '../utils/layerFactory';
import { cardTemplates } from '../../../components/InfoBox/utils/cardTemplates';

const createEducacionLayer = createLayerFactory('educacion');

const escuelasConfig = cardTemplates.TDEMECLUEV({
    title: 'centro_educativo',
    municipio: ['municipio', 'localidad'],
    caracteristica: ['nivel_educativo', 'control'],
    list: [
        { label: 'Turno', field: 'turno' },
        { label: 'Sostenimiento', field: 'sostenimiento' },
    ],
    ubicacion: 'domicilio',
    stats: [
        { label: 'Cantidad de alumnas mujeres', field: 'cantidad_mujeres' },
        { label: 'Cantidad de alumnos hombres', field: 'cantidad_hombres' },
        { label: 'Total de alumnos', field: 'total_alumnos' },
        { label: 'Cantidad de docentes y directivos', field: 'total_docentes_directivos' },
    ]
});

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
            id: 'infrestructura_educacion',
            label: 'Infraestructura en Educación',
            isCategory: true,
            children: [
                {
                    id: 'escuelas',
                    label: 'Escuelas',
                    forceGroup: true,
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
        },
        {
            id: 'rezago_educativo',
            label: 'Rezago Educativo',
            isCategory: true,
            children: [{}]
        }
    ]
};
