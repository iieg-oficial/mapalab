import { createLayerFactory } from '../utils/layerFactory';

const createDemografiaLayer = createLayerFactory('demografia');

const SUBCAPAS = [
    ['poblacion_total', 'Población', 'poblacion', ['demografia', 'habitantes', 'residentes', 'censo', 'proyeccion', 'estadistica', 'conapo']],
    ['poblacion_hombres', 'Población hombres', 'poblacion_hombres', ['demografia', 'hombres', 'habitantes', 'residentes', 'censo', 'proyeccion', 'estadistica', 'conapo']],
    ['poblacion_mujeres', 'Población mujeres', 'poblacion_mujeres', ['demografia', 'mujeres', 'habitantes', 'residentes', 'censo', 'proyeccion', 'estadistica', 'conapo']],
    ['tasa_fecundidad', 'Tasa de fecundidad', 'tasa_fecundidad', ['demografia', 'natalidad', 'nacimientos', 'reproduccion', 'hijos', 'mujeres', 'maternidad']],
    ['razon_dependencia_infantil', 'Razón de dependencia infantil', 'razon_dependencia_infantil', ['demografia', 'infancia', 'niños', 'menores', 'carga_economica', 'estructura_edad', 'dependientes']],
    ['razon_dependencia_adultos', 'Razón de dependencia adultos', 'razon_dependencia_adultos', ['demografia', 'vejez', 'ancianos', 'tercera_edad', 'jubilados', 'envejecimiento', 'adulto_mayor']],
    ['razon_dependencia', 'Razón de dependencia', 'razon_dependencia', ['demografia', 'carga_economica', 'productividad', 'estructura_edad', 'poblacion_activa', 'bono_demografico']],
    ['edad_mediana', 'Edad mediana por municipio', 'edad_mediana', ['demografia', 'promedio_edad', 'envejecimiento', 'juventud', 'estructura_poblacional', 'madurez']],
    ['migracion', '*Migración', 'migracion', ['demografia', 'movilidad', 'inmigracion', 'emigracion', 'desplazamiento', 'flujo_poblacional', 'extranjeros', 'remesas']]
];

export const demografiaLayers = {
    id: 'demografia',
    label: 'Demografía',
    children: [
        {
            id: 'poblacion',
            label: 'Población',
            base: 'iieg',
            children: SUBCAPAS.map(([id, label, layerName, tags]) => ({
                id,
                label,
                wmsConfig: createDemografiaLayer(layerName),
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
