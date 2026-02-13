import { createLayerFactory } from '../utils/layerFactory';
import { cardTemplates } from '../../../components/InfoBox/utils/cardTemplates';

const createDemografiaLayer = createLayerFactory('demografia');

const razonAdultosConfig = cardTemplates.TEEMLEV({
    title: 'Razón de dependencia adulta',
    municipio: 'municipio',
    list: [
        { label: 'Año seleccionado', field: 'fecha' },
    ],
    text: [
        { label: 'Personas mayores de 64 años por cada 100 personas de 15-64' },
    ],
    stats: [
        { label: 'Razón de dependencia adulta', field: 'valor' },
    ]
});

const TASAS_POBLACION = [
    ['tasa_poblacion_total', 'Población estimada', 'poblacion', ['demografia', 'habitantes', 'residentes', 'censo', 'proyeccion', 'estadistica', 'conapo']],
    ['tasa_poblacion_mujeres', 'Población femenina estimada', 'poblacion_mujeres', ['demografia', 'mujeres', 'habitantes', 'residentes', 'censo', 'proyeccion', 'estadistica', 'conapo']],
    ['tasa_poblacion_hombres', 'Población masculina estimada', 'poblacion_hombres', ['demografia', 'hombres', 'habitantes', 'residentes', 'censo', 'proyeccion', 'estadistica', 'conapo']],
    ['tasa_fecundidad', 'Tasa de fecundidad', 'tasa_fecundidad', ['demografia', 'natalidad', 'nacimientos', 'reproduccion', 'hijos', 'mujeres', 'maternidad']],
    ['tasa_dependencia_infantil', 'Razón de dependencia infantil', 'razon_dependencia_infantil', ['demografia', 'infancia', 'niños', 'menores', 'carga_economica', 'estructura_edad', 'dependientes']],
    ['tasa_dependencia_adultos', 'Razón de dependencia adultos (65+)', 'razon_dependencia_adulta', ['demografia', 'vejez', 'ancianos', 'tercera_edad', 'jubilados', 'envejecimiento', 'adulto_mayor']],
    ['tasa_dependencia', 'Razón de dependencia total', 'razon_dependencia', ['demografia', 'carga_economica', 'productividad', 'estructura_edad', 'poblacion_activa', 'bono_demografico']],
    ['tasa_edad_mediana', 'Edad mediana', 'edad_mediana', ['demografia', 'promedio_edad', 'envejecimiento', 'juventud', 'estructura_poblacional', 'madurez']],
];

export const demografiaLayers = {
    id: 'demografia',
    label: 'Demografía',
    children: [
        {
            id: 'poblacion',
            label: 'Población',
            isCategory: true,
            children: TASAS_POBLACION.map(([id, label, layerName, tags]) => ({
                id,
                label,
                wmsConfig: createDemografiaLayer(layerName),
                littleCard: razonAdultosConfig,
                searchMeta: { tags }
            }))
        }
    ]
};
