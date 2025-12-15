import { createLayerFactory } from '../utils/layerFactory';

const createEducacionLayer = createLayerFactory('educacion');

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
