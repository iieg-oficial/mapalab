import { createLayerFactory } from '../utils/layerFactory';
import { cardTemplates, createMunicipioConfig } from '../../../components/InfoBox/utils/cardTemplates';

const createEducacionLayer = createLayerFactory('educacion');
const createDesarrolloLayer = createLayerFactory('desarrollo');

const escuelasConfig = cardTemplates.TDEMECLUEV({
    title: 'centro_educativo',
    municipio: 'municipio',
    caracteristica: ['nivel_educativo', 'sostenimiento', 'turno'],
    list: [
        { label: 'Año de la información', field: 'fecha' },
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
    ['bachillerato', 'Bachillerato', 'Bachillerato', ['educacion', 'escuela', 'bachillerato', 'preparatoria', 'media_superior', 'prepa', 'cobaej', 'cecytej', 'conalep']],
    ['primaria', 'Primaria', 'primaria', ['educacion', 'escuela', 'primaria', 'basica', 'niños', 'elemental', 'primer_grado']],
    ['secundaria', 'Secundaria', 'secundaria', ['educacion', 'escuela', 'secundaria', 'media_basica', 'adolescentes', 'telesecundaria', 'tecnica']],
    ['especial', 'Especial', 'especial', ['educacion', 'escuela', 'especial', 'discapacitados', 'necesidades_especiales']],
    ['inicial', 'Inicial', 'inicial', ['educacion', 'escuela', 'inicial', 'guarderia', 'estancia_infantil', 'bebes', 'ninos_pequenos']],
    ['profesional_tecnico', 'Profesional técnico', 'profesional_tecnico', ['educacion', 'escuela', 'profesional_tecnico', 'tecnico', 'profesional', 'tecnica', 'tecnologico', 'utc', 'cbtis', 'cetis']],
    ['licenciaturas', 'Licenciaturas', 'Licenciatura', ['educacion', 'escuela', 'licenciatura', 'universidad', 'superior', 'carrera', 'facultad', 'campus', 'posgrado', 'maestria', 'doctorado']],
];

export const educacionLayers = {
    id: 'educacion',
    label: 'Educación',
    children: [
        {
            id: 'infrestructura_educacion',
            label: 'Oferta e infraestructura',
            isCategory: true,
            children: [
                {
                    id: 'cat-centros-educativos',
                    label: 'Centros educativos',
                    forceGroup: true,
                    children: NIVELES.map(([id, label, nivel, tags]) => ({
                        id,
                        label,
                        wmsConfig: createEducacionLayer.withFilter('centros_educativos', `nivel_educativo ILIKE '${nivel}'`),
                        littleCard: escuelasConfig,
                        searchMeta: { tags }
                    }))
                }
            ]
        }, {
            id: 'cat-capacidades-alfabetizacion',
            label: 'Capacidades y alfabetización',
            isCategory: true,
            children: [{
                id: 'rezago_educativo',
                label: 'Rezago educativo',
                wmsConfig: createDesarrolloLayer('rezago_educativo'),
                littleCard: createMunicipioConfig({
                    title: 'Personas en situación de rezago educativo',
                    text: 'Porcentaje sobre la población total del municipio. Para la descripción de rezago educativo, favor de ver la nota metodológica.',
                    stats: [
                        { label: 'Número de personas', field: 'personas' },
                        { label: 'Porcentaje', field: 'porcentaje' },
                        { label: 'Carencias promedio', field: 'carencias_promedio' },
                    ]
                }),
                searchMeta: { tags: ['educacion', 'rezago', 'alfabetizacion', 'escuela'] }
            }]
        }
    ]
};
