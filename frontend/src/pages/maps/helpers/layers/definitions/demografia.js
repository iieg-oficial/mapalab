import { createLayerFactory } from '../utils/layerFactory';

const createDemografiaLayer = createLayerFactory('demografia');

const SUBCAPAS = [
    ['poblacion_estimada', '*Población estimada a mitad de año', 'poblacion_estimada', ['demografia', 'habitantes', 'residentes', 'censo', 'proyeccion', 'estadistica', 'conapo']],
    ['tasa_fecundidad', '*Tasa de fecundidad', 'tasa_fecundidad', ['demografia', 'natalidad', 'nacimientos', 'reproduccion', 'hijos', 'mujeres', 'maternidad']],
    ['razon_dependencia_infantil', '*Razón de dependencia infantil', 'razon_dependencia_infantil', ['demografia', 'infancia', 'niños', 'menores', 'carga_economica', 'estructura_edad', 'dependientes']],
    ['razon_dependencia_adultos_mayores', '*Razón de dependencia adultos mayores', 'razon_dependencia_adultos_mayores', ['demografia', 'vejez', 'ancianos', 'tercera_edad', 'jubilados', 'envejecimiento', 'adulto_mayor']],
    ['razon_dependencia_total', '*Razón de dependencia total', 'razon_dependencia_total', ['demografia', 'carga_economica', 'productividad', 'estructura_edad', 'poblacion_activa', 'bono_demografico']],
    ['edad_mediana', '*Edad mediana por municipio', 'edad_mediana', ['demografia', 'promedio_edad', 'envejecimiento', 'juventud', 'estructura_poblacional', 'madurez']],
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
