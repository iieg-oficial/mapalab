import { createLayerFactory } from '../utils/layerFactory';
import { createMunicipioConfig } from '../../../components/InfoBox/utils/cardTemplates';

const createSeguridadLayer = createLayerFactory('seguridad');

const TASA_STATS_HOMICIDIO = [
    { label: 'Tasa', field: 'tasa_carpetas_investigacion' },
    { label: 'Carpetas de investigación', field: 'carpetas_investigacion' },
    { label: 'Con arma de fuego', field: 'con_arma_de_fuego' },
    { label: 'Con arma blanca', field: 'con_arma_blanca' },
    { label: 'Con otro elemento', field: 'con_otro_elemento' },
    { label: 'No especificado', field: 'no_especificado' },
];

const TASA_STATS_BASE = [
    { label: 'Tasa', field: 'tasa_carpetas_investigacion' },
    { label: 'Carpetas de investigación', field: 'carpetas_investigacion' },
];

const TASA_STATS_ROBOS = [
    { label: 'Tasa', field: 'tasa_carpetas_investigacion' },
    { label: 'Carpetas de investigación', field: 'carpetas_investigacion' },
    { label: 'Con violencia', field: 'con_violencia' },
    { label: 'Sin violencia', field: 'sin_violencia' },
];

const tasaText = (texto) => texto || 'Muestra la tasa por cada 100 mil habitantes respecto al periodo seleccionado.';

const createTasaConfig = (title, stats, text) => createMunicipioConfig({
    title,
    text: tasaText(text),
    stats
});

const delitoConfig = {
    headerField: 'delito',
    labelGroups: [
        { fields: ['municipio'] },
        { fields: ['dia_semana'] }
    ],
    list: [
        { label: 'Fecha del evento', field: 'fecha' },
        { label: 'Hora', field: 'rango_hora' },
    ]
};

const delitoRoboConfig = {
    headerField: 'delito',
    labelGroups: [
        { fields: ['municipio'] },
        { fields: ['modalidad'] },
        { fields: ['dia_semana'] }
    ],
    list: [
        { label: 'Fecha del evento', field: 'fecha' },
        { label: 'Hora del evento', field: 'rango_hora' },
    ]
};

const desaparecidosText = 'Las tasas se calculan respecto a la población total (ambos sexos), por cada 100,000 habitantes.';

const TASAS_DELITOS_FUERO = [
    { id: 'tasa_feminicidio', label: 'Feminicidios (tasa)', layerName: 'datos_delitos_feminicidio_secretariado', tags: ['seguridad', 'delito', 'feminicidio', 'tasa', 'mujer'],
        littleCard: createTasaConfig('Feminicidio', TASA_STATS_HOMICIDIO, 'Tasa de carpetas de investigación por cada 100 mil habitantes.') },
    { id: 'tasa_homicidio_doloso', label: 'Homicidio doloso (tasa)', layerName: 'datos_delitos_homicidio_doloso_secretariado', tags: ['seguridad', 'delito', 'homicidio', 'tasa', 'asesinato', 'crimen', 'violencia'],
        littleCard: createTasaConfig('Homicidio doloso', TASA_STATS_HOMICIDIO, 'Tasa de carpetas de investigación por cada 100 mil habitantes.') },
    { id: 'tasa_lesiones_dolosas', label: 'Lesiones dolosas (tasa)', layerName: 'datos_delitos_lesiones_dolosas_secretariado', tags: ['seguridad', 'delito', 'lesiones', 'dolosas', 'tasa', 'golpes', 'agresion', 'fisica'],
        littleCard: createTasaConfig('Lesiones dolosas', TASA_STATS_HOMICIDIO, 'Tasa de carpetas de investigación por cada 100 mil habitantes.') },
];

const TASA_DELITOS_LIBERTAD = [
    { id: 'tasa_violacion', label: 'Violación (tasa)', layerName: 'datos_delitos_violacion_secretariado', tags: ['seguridad', 'delito', 'violacion', 'tasa', 'sexual'],
        littleCard: createTasaConfig('Violación', TASA_STATS_BASE) },
    { id: 'tasa_abuso_sexual', label: 'Abuso sexual (tasa)', layerName: 'datos_delitos_abuso_sexual_secretariado', tags: ['seguridad', 'delito', 'abuso', 'sexual', 'tasa', 'infantil'],
        littleCard: createTasaConfig('Abuso sexual', TASA_STATS_BASE) },
];

const TASA_DELITOS_FAMILIA = [
    { id: 'tasa_violencia_de_genero', label: 'Violencia de género (tasa)', layerName: 'datos_delitos_violencia_de_genero_secretariado', tags: ['seguridad', 'delito', 'violencia', 'genero', 'tasa', 'domestica'],
        littleCard: createTasaConfig('Violencia de género', TASA_STATS_BASE, 'Las cifras se refieren a violencia de género en todas sus modalidades distintas a la violencia familiar. Las tasas se presentan respecto al periodo seleccionado, por cada 100 mil habitantes') },
    { id: 'tasa_violencia_familiar', label: 'Violencia familiar (tasa)', layerName: 'datos_delitos_violencia_familiar_secretariado', tags: ['seguridad', 'delito', 'violencia', 'familia', 'tasa', 'domestica'],
        littleCard: createTasaConfig('Violencia familiar', TASA_STATS_BASE) },
];

const TASA_DELITOS_PATRIMONIO = [
    { id: 'tasa_robos_coche_cuatro_ruedas', label: 'Robo de coche a cuatro ruedas (tasa)', layerName: 'datos_delitos_robos_coche_cuatro_ruedas_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        littleCard: createTasaConfig('Robo de coche de cuatro ruedas', TASA_STATS_ROBOS) },
    { id: 'tasa_robos_transportistas', label: 'Robo de transportistas (tasa)', layerName: 'datos_delitos_robos_transportistas_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        littleCard: createTasaConfig('Robo a transportista', TASA_STATS_ROBOS) },
    { id: 'tasa_robos_motocicleta', label: 'Robo de motocicleta (tasa)', layerName: 'datos_delitos_robos_motocicleta_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        littleCard: createTasaConfig('Robo de motocicleta', TASA_STATS_ROBOS) },
    { id: 'tasa_robos_personas', label: 'Robo a personas (tasa)', layerName: 'datos_delitos_robos_personas_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        littleCard: createTasaConfig('Robo a persona', TASA_STATS_ROBOS) },
    { id: 'tasa_robos_casa_habitacion', label: 'Robo a casa habitacion (tasa)', layerName: 'datos_delitos_robos_casa_habitacion_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        littleCard: createTasaConfig('Robo a casa habitación', TASA_STATS_ROBOS) },
    { id: 'tasa_robos_negocio', label: 'Robo a negocio (tasa)', layerName: 'datos_delitos_robos_negocio_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        littleCard: createTasaConfig('Robo a negocio', TASA_STATS_ROBOS) },
    { id: 'tasa_robos_autopartes', label: 'Robo de autopartes (tasa)', layerName: 'datos_delitos_robos_autopartes_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        littleCard: createTasaConfig('Robo de autopartes', TASA_STATS_ROBOS) },
    { id: 'tasa_robos_instituciones_bancarias', label: 'Robo a instituciones bancarias (tasa)', layerName: 'datos_delitos_robos_instituciones_bancarias_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        littleCard: createTasaConfig('Robo a institución bancaria', TASA_STATS_ROBOS) },
];

const DELITOS_VIDA = [
    { id: 'eminicidio', label: 'Feminicidio', layerName: 'delitos_fiscalia_feminicidio', tags: ['seguridad', 'delito', 'feminicidio', 'tasa', 'mujer'] },
    { id: 'homicidio_doloso', label: 'Homicidio doloso', layerName: 'delitos_fiscalia_homicidio_doloso', tags: ['seguridad', 'delito', 'homicidio', 'tasa', 'asesinato', 'crimen', 'violencia'] },
    { id: 'lesiones_dolosas', label: 'Lesiones dolosas', layerName: 'delitos_fiscalia_lesiones_dolosas', tags: ['seguridad', 'delito', 'lesiones', 'dolosas', 'tasa', 'golpes', 'agresion', 'fisica'] },
];

const DELITOS_LIBERTAD = [
    { id: 'abuso_sexual_infantil', label: 'Abuso sexual infantil', layerName: 'delitos_fiscalia_abuso_sexual_infantil', tags: ['seguridad', 'delito', 'abuso', 'sexual', 'infantil', 'tasa', 'violencia'] },
    { id: 'violacion', label: 'Violacion', layerName: 'delitos_fiscalia_violacion', tags: ['seguridad', 'delito', 'violacion', 'tasa', 'sexual'] },
];

const DELITOS_FAMILIA = [
    { id: 'violencia_familiar', label: 'Violencia familiar', layerName: 'delitos_fiscalia_violencia_familiar', tags: ['seguridad', 'delito', 'violencia', 'familiar', 'tasa', 'domestica'] },
];

const DELITOS_PATRIMONIO = [
    { id: 'robos_coche_cuatro_ruedas', label: 'Robo de coche a cuatro ruedas', layerName: 'delitos_fiscalia_robo_vehiculos_particulares', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
    { id: 'robos_transportistas', label: 'Robo de transportistas', layerName: 'delitos_fiscalia_robo_transportistas', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
    { id: 'robos_motocicleta', label: 'Robo de motocicleta', layerName: 'delitos_fiscalia_robo_motocicleta', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
    { id: 'robos_personas', label: 'Robo a personas', layerName: 'delitos_fiscalia_robo_persona', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
    { id: 'robos_casa_habitacion', label: 'Robo a casa habitacion', layerName: 'delitos_fiscalia_robo_casa_habitacion', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
    { id: 'robos_negocio', label: 'Robo a negocio', layerName: 'delitos_fiscalia_robo_negocio', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
    { id: 'robos_autopartes', label: 'Robo de autopartes', layerName: 'delitos_fiscalia_robo_autopartes', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
    { id: 'robos_instituciones_bancarias', label: 'Robo a instituciones bancarias', layerName: 'delitos_fiscalia_robo_bancos', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
];

const DESAPARECIDAS = [
    { id: 'tasa_personas_desaparecidas', label: 'Personas desaparecidas (tasa)', style: 'personas_desaparecidas_total', not: 'tasa_personas', tags: ['seguridad', 'delito', 'desaparecidos', 'tasa', 'incidencia'],
        littleCard: createMunicipioConfig({
            title: 'Personas desaparecidas',
            text: desaparecidosText,
            stats: [
                { label: 'Total', field: 'total' },
                { label: 'Tasa total', field: 'tasa_total' },
                { label: 'Mujeres', field: 'total_mujeres' },
                { label: 'Tasa mujeres', field: 'tasa_mujeres' },
                { label: 'Hombres', field: 'total_hombres' },
                { label: 'Tasa hombres', field: 'tasa_hombres' },
            ]
        }) },
    { id: 'tasa_mujeres_desaparecidas', label: 'Mujeres desaparecidas (tasa)', style: 'desaparecidos_mujeres', not: 'tasa_mujeres', tags: ['seguridad', 'delito', 'desaparecidos', 'tasa', 'incidencia'],
        littleCard: createMunicipioConfig({
            title: 'Mujeres desaparecidas',
            text: desaparecidosText,
            stats: [
                { label: 'Mujeres', field: 'total_mujeres' },
                { label: 'Tasa mujeres', field: 'tasa_mujeres' },
            ]
        }) },
    { id: 'tasa_hombres_desaparecidos', label: 'Hombres desaparecidos (tasa)', style: 'desaparecidos_hombres', not: 'tasa_hombres', tags: ['seguridad', 'delito', 'desaparecidos', 'tasa', 'incidencia'],
        littleCard: createMunicipioConfig({
            title: 'Hombres desaparecidos',
            text: desaparecidosText,
            stats: [
                { label: 'Hombres', field: 'total_hombres' },
                { label: 'Tasa hombres', field: 'tasa_hombres' },
            ]
        }) },
];

const LOCALIZADAS = [
    { id: 'tasa_personas_localizadas', label: 'Personas localizadas (tasa)', layerName: 'personas_localizadas', tags: ['seguridad', 'delito', 'localizadas', 'tasa', 'incidencia'],
        littleCard: createMunicipioConfig({
            title: 'Personas localizadas',
            text: desaparecidosText,
            stats: [
                { label: 'Total', field: 'total' },
                { label: 'Con vida', field: 'con_vida' },
                { label: 'Sin vida', field: 'sin_vida' },
                { label: 'Tasa total', field: 'tasa_total' },
                { label: 'Mujeres', field: 'total_mujeres' },
                { label: 'Mujeres con vida', field: 'mujeres_con_vida' },
                { label: 'Mujeres sin vida', field: 'mujeres_sin_vida' },
                { label: 'Tasa mujeres', field: 'tasa_mujeres' },
                { label: 'Hombres', field: 'total_hombres' },
                { label: 'Hombres con vida', field: 'hombres_con_vida' },
                { label: 'Hombres sin vida', field: 'hombres_sin_vida' },
                { label: 'Tasa hombres', field: 'tasa_hombres' },
            ]
        }) },
    { id: 'tasa_mujeres_localizadas', label: 'Mujeres localizadas (tasa)', layerName: 'personas_localizadas_mujeres', tags: ['seguridad', 'delito', 'localizadas', 'tasa', 'incidencia'],
        littleCard: createMunicipioConfig({
            title: 'Mujeres localizadas',
            text: desaparecidosText,
            stats: [
                { label: 'Mujeres', field: 'total_mujeres' },
                { label: 'Mujeres con vida', field: 'mujeres_con_vida' },
                { label: 'Mujeres sin vida', field: 'mujeres_sin_vida' },
                { label: 'Tasa mujeres', field: 'tasa_mujeres' },
            ]
        }) },
    { id: 'tasa_hombres_localizados', label: 'Hombres localizados (tasa)', layerName: 'personas_localizadas_hombres', tags: ['seguridad', 'delito', 'localizadas', 'tasa', 'incidencia'],
        littleCard: createMunicipioConfig({
            title: 'Hombres localizados',
            text: desaparecidosText,
            stats: [
                { label: 'Hombres', field: 'total_hombres' },
                { label: 'Hombres con vida', field: 'hombres_con_vida' },
                { label: 'Hombres sin vida', field: 'hombres_sin_vida' },
                { label: 'Tasa hombres', field: 'tasa_hombres' },
            ]
        }) },
];

const mapTasas = (items) => items.map(({ id, label, layerName, tags, littleCard }) => ({
    id, label,
    wmsConfig: createSeguridadLayer(layerName),
    littleCard,
    searchMeta: { tags }
}));

const mapDelitos = (items, config) => items.map(({ id, label, layerName, tags }) => ({
    id, label,
    wmsConfig: createSeguridadLayer(layerName),
    littleCard: config,
    searchMeta: { tags }
}));

export const seguridadLayers = {
    id: 'seguridad',
    label: 'Seguridad',
    children: [
        {
            id: 'delitos-fuero-comun',
            label: 'Incidencia en delitos del fuero común',
            isCategory: true,
            children: [
                {
                    id: 'cat-vida-integridad',
                    label: 'Delitos contra la vida y la integridad corporal',
                    isLabel: true,
                    children: mapTasas(TASAS_DELITOS_FUERO)
                }, {
                    id: 'cat-libertad-sexual',
                    label: 'Delitos contra la libertad y la seguridad sexual',
                    isLabel: true,
                    children: mapTasas(TASA_DELITOS_LIBERTAD)
                }, {
                    id: 'cat-familia',
                    label: 'Delitos contra la familia',
                    isLabel: true,
                    children: mapTasas(TASA_DELITOS_FAMILIA)
                }, {
                    id: 'cat-patrimonio',
                    label: 'Delitos contra el patrimonio',
                    isLabel: true,
                    children: mapTasas(TASA_DELITOS_PATRIMONIO)
                }
            ]
        }, {
            id: 'delitos_del_fuero_comun',
            label: 'Delitos del fuero común',
            isCategory: true,
            children: [{
                id: 'cat-vida-integridad',
                label: 'Delitos contra la vida y la integridad corporal',
                isLabel: true,
                children: mapDelitos(DELITOS_VIDA, delitoConfig)
            }, {
                id: 'cat-libertad-sexual',
                label: 'Delitos contra la libertad y la seguridad sexual',
                isLabel: true,
                children: mapDelitos(DELITOS_LIBERTAD, delitoConfig)
            }, {
                id: 'cat-familia',
                label: 'Delitos contra la familia',
                isLabel: true,
                children: mapDelitos(DELITOS_FAMILIA, delitoConfig)
            }, {
                id: 'cat-patrimonio',
                label: 'Delitos contra el patrimonio',
                isLabel: true,
                children: DELITOS_PATRIMONIO.map(({ id, label, layerName, tags }) => ({
                    id,
                    label,
                    forceGroup: true,
                    children: [
                        {
                            id: `${id}_con_violencia`,
                            label: 'Con violencia',
                            wmsConfig: createSeguridadLayer.withFilter(layerName, "modalidad = 'Con violencia'"),
                            littleCard: delitoRoboConfig,
                            searchMeta: { tags: [...tags, 'violencia'] }
                        },
                        {
                            id: `${id}_sin_violencia`,
                            label: 'Sin violencia',
                            wmsConfig: createSeguridadLayer.withFilter(layerName, "modalidad = 'Sin violencia'"),
                            littleCard: delitoRoboConfig,
                            searchMeta: { tags: [...tags, 'sin_violencia'] }
                        },
                        {
                            id: `${id}_sin_especificar`,
                            label: 'Sin especificar',
                            wmsConfig: createSeguridadLayer.withFilter(layerName, "modalidad IS NULL OR modalidad = ''"),
                            littleCard: delitoRoboConfig,
                            searchMeta: { tags: [...tags, 'sin_especificar'] }
                        }
                    ]
                }))
            }
            ]
        }, {
            id: 'personas-desaparecidas',
            label: 'Personas Desaparecidas',
            isCategory: true,
            children: [
                {
                    id: 'cat-personas-desaparecidas',
                    label: 'Personas desaparecidas',
                    isLabel: true,
                    children: DESAPARECIDAS.map(({ id, label, style, not, tags, littleCard }) => ({
                        id,
                        label,
                        wmsConfig: createSeguridadLayer.withFilterAndStyles('personas_desaparecidas', `${not} IS NOT NULL`, style),
                        littleCard,
                        searchMeta: { tags }
                    }))
                }, {
                    id: 'cat-personas-localizadas',
                    label: 'Personas localizadas',
                    isLabel: true,
                    children: LOCALIZADAS.map(({ id, label, layerName, tags, littleCard }) => ({
                        id,
                        label,
                        wmsConfig: createSeguridadLayer(layerName),
                        littleCard,
                        searchMeta: { tags }
                    }))
                }
            ]
        }
    ]
};
