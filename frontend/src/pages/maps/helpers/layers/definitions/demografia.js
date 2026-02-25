import { createLayerFactory } from '../utils/layerFactory';
import { createMunicipioConfig } from '../../../components/InfoBox/utils/cardTemplates';

const createDemografiaLayer = createLayerFactory('demografia');

const TASAS_POBLACION = [
    ['tasa_poblacion_total', 'Población estimada', 'poblacion',
        ['demografia', 'habitantes', 'residentes', 'censo', 'proyeccion', 'estadistica', 'conapo'],
        createMunicipioConfig({
            title: 'Población',
            stats: [
                { label: 'Población total', field: 'poblacion_total' },
                { label: 'Población mujeres', field: 'poblacion_mujeres' },
                { label: 'Población hombres', field: 'poblacion_hombres' },
                { label: 'Porcentaje respecto a Jalisco', field: 'poblacion_respecto_jalisco' },
            ]
        })],
    ['tasa_poblacion_mujeres', 'Población femenina estimada', 'poblacion_mujeres',
        ['demografia', 'mujeres', 'habitantes', 'residentes', 'censo', 'proyeccion', 'estadistica', 'conapo'],
        createMunicipioConfig({
            title: 'Población femenina',
            stats: [{ label: 'Población mujeres', field: 'valor' }]
        })],
    ['tasa_poblacion_hombres', 'Población masculina estimada', 'poblacion_hombres',
        ['demografia', 'hombres', 'habitantes', 'residentes', 'censo', 'proyeccion', 'estadistica', 'conapo'],
        createMunicipioConfig({
            title: 'Población masculina',
            stats: [{ label: 'Población hombres', field: 'valor' }]
        })],
    ['tasa_fecundidad', 'Tasa de fecundidad', 'tasa_fecundidad',
        ['demografia', 'natalidad', 'nacimientos', 'reproduccion', 'hijos', 'mujeres', 'maternidad'],
        createMunicipioConfig({
            title: 'Tasa de fecundidad general',
            text: 'Nacimientos por cada 1,000 mujeres de 15-49 años',
            stats: [
                { label: 'Población mujeres entre 15 y 49 años', field: 'poblacion_mujeres_15_49' },
                { label: 'Nacimientos registrados', field: 'nacimientos' },
                { label: 'Tasa de fecundidad', field: 'tasa_fecundidad_general' },
            ]
        })],
    ['tasa_dependencia_infantil', 'Razón de dependencia infantil', 'razon_dependencia_infantil',
        ['demografia', 'infancia', 'niños', 'menores', 'carga_economica', 'estructura_edad', 'dependientes'],
        createMunicipioConfig({
            title: 'Razón de dependencia infantil',
            text: 'Es igual a la división de la población menor o igual a 14 años entre la población de 15 a 64 años por cien.',
            stats: [{ label: 'Razón de dependencia infantil', field: 'valor' }]
        })],
    ['tasa_dependencia_adultos', 'Razón de dependencia adultos (65+)', 'razon_dependencia_adulta',
        ['demografia', 'vejez', 'ancianos', 'tercera_edad', 'jubilados', 'envejecimiento', 'adulto_mayor'],
        createMunicipioConfig({
            title: 'Razón de dependencia adulta',
            text: 'Es igual a la división de la población de 65 años y más entre la población de 15 a 64 años por cien.',
            stats: [{ label: 'Razón de dependencia adulta', field: 'valor' }]
        })],
    ['tasa_dependencia', 'Razón de dependencia total', 'razon_dependencia',
        ['demografia', 'carga_economica', 'productividad', 'estructura_edad', 'poblacion_activa', 'bono_demografico'],
        createMunicipioConfig({
            title: 'Razón de dependencia total',
            text: 'Es igual a la suma de la población de 0 a 14 años más la población de 65 años y más entre la población de 15 a 64 años por cien.',
            stats: [{ label: 'Razón de dependencia total', field: 'valor' }]
        })],
    ['tasa_edad_mediana', 'Edad mediana', 'edad_mediana',
        ['demografia', 'promedio_edad', 'envejecimiento', 'juventud', 'estructura_poblacional', 'madurez'],
        createMunicipioConfig({
            title: 'Edad mediana',
            text: 'Representa la edad que divide la población en dos grupos numéricamente iguales, dejando el mismo número de personas por debajo y por encima de ella.',
            stats: [{ label: 'Edad mediana (años)', field: 'valor' }]
        })],
];

export const demografiaLayers = {
    id: 'demografia',
    label: 'Demografía',
    children: [
        {
            id: 'poblacion',
            label: 'Población',
            isCategory: true,
            children: TASAS_POBLACION.map(([id, label, layerName, tags, littleCard]) => ({
                id,
                label,
                wmsConfig: createDemografiaLayer(layerName),
                littleCard,
                searchMeta: { tags }
            }))
        }
    ]
};
