import { createLayerFactory } from '../utils/layerFactory';
import { createMunicipioConfig } from '../../../components/InfoBox/utils/cardTemplates';

const createSeguridadLayer = createLayerFactory('seguridad');

const TASA_DEFAULT_DATE = { year: 2025 };

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

const createTasaConfig = (title, stats, text) => createMunicipioConfig({
    title,
    text: text || 'Muestra la tasa por cada 100 mil habitantes respecto al periodo seleccionado.',
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
    ['tasa_feminicidio', 'Feminicidios (tasa)', 'datos_delitos_feminicidio_secretariado',
        ['seguridad', 'delito', 'feminicidio', 'tasa', 'mujer'],
        createTasaConfig('Feminicidio', TASA_STATS_HOMICIDIO, 'Tasa de carpetas de investigación por cada 100 mil habitantes.')],
    ['tasa_homicidio_doloso', 'Homicidio doloso (tasa)', 'datos_delitos_homicidio_doloso_secretariado',
        ['seguridad', 'delito', 'homicidio', 'tasa', 'asesinato', 'crimen', 'violencia'],
        createTasaConfig('Homicidio doloso', TASA_STATS_HOMICIDIO, 'Tasa de carpetas de investigación por cada 100 mil habitantes.')],
    ['tasa_lesiones_dolosas', 'Lesiones dolosas (tasa)', 'datos_delitos_lesiones_dolosas_secretariado',
        ['seguridad', 'delito', 'lesiones', 'dolosas', 'tasa', 'golpes', 'agresion', 'fisica'],
        createTasaConfig('Lesiones dolosas', TASA_STATS_HOMICIDIO, 'Tasa de carpetas de investigación por cada 100 mil habitantes.')],
];

const TASA_DELITOS_LIBERTAD = [
    ['tasa_violacion', 'Violación (tasa)', 'datos_delitos_violacion_secretariado',
        ['seguridad', 'delito', 'violacion', 'tasa', 'sexual'],
        createTasaConfig('Violación', TASA_STATS_BASE)],
    ['tasa_abuso_sexual', 'Abuso sexual (tasa)', 'datos_delitos_abuso_sexual_secretariado',
        ['seguridad', 'delito', 'abuso', 'sexual', 'tasa', 'infantil'],
        createTasaConfig('Abuso sexual', TASA_STATS_BASE)],
];

const TASA_DELITOS_FAMILIA = [
    ['tasa_violencia_de_genero', 'Violencia de género (tasa)', 'datos_delitos_violencia_genero_no_familiar_secretariado',
        ['seguridad', 'delito', 'violencia', 'genero', 'tasa', 'domestica'],
        createTasaConfig('Violencia de género', TASA_STATS_BASE, 'Las cifras se refieren a violencia de género en todas sus modalidades distintas a la violencia familiar. Las tasas se presentan respecto al periodo seleccionado, por cada 100 mil habitantes')],
    ['tasa_violencia_familiar', 'Violencia familiar (tasa)', 'datos_delitos_violencia_familiar_secretariado',
        ['seguridad', 'delito', 'violencia', 'familia', 'tasa', 'domestica'],
        createTasaConfig('Violencia familiar', TASA_STATS_BASE)],
];

const TASA_DELITOS_PATRIMONIO = [
    ['tasa_robos_coche_cuatro_ruedas', 'Robo de coche a cuatro ruedas (tasa)', 'datos_delitos_robo_coche_cuatro_ruedas_secretariado',
        ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        createTasaConfig('Robo de coche de cuatro ruedas', TASA_STATS_ROBOS)],
    ['tasa_robos_transportistas', 'Robo de transportistas (tasa)', 'datos_delitos_robo_transportista_secretariado',
        ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        createTasaConfig('Robo a transportista', TASA_STATS_ROBOS)],
    ['tasa_robos_motocicleta', 'Robo de motocicletas (tasa)', 'datos_delitos_robo_motocicleta_secretariado',
        ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        createTasaConfig('Robo de motocicletas', TASA_STATS_ROBOS)],
    ['tasa_robos_personas', 'Robo a persona (tasa)', 'datos_delitos_robo_transeunte_via_publica_secretariado',
        ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        createTasaConfig('Robo a persona', TASA_STATS_ROBOS)],
    ['tasa_robos_casa_habitacion', 'Robo a casa habitación (tasa)', 'datos_delitos_robo_casa_habitacion_secretariado',
        ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        createTasaConfig('Robo a casa habitación', TASA_STATS_ROBOS)],
    ['tasa_robos_negocio', 'Robo a negocio (tasa)', 'datos_delitos_robo_negocio_secretariado',
        ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        createTasaConfig('Robo a negocio', TASA_STATS_ROBOS)],
    ['tasa_robos_autopartes', 'Robo de autopartes (tasa)', 'datos_delitos_robo_autopartes_secretariado',
        ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        createTasaConfig('Robo de autopartes', TASA_STATS_ROBOS)],
    ['tasa_robos_instituciones_bancarias', 'Robo a instituciones bancarias (tasa)', 'datos_delitos_robo_institucion_bancaria_secretariado',
        ['seguridad', 'delito', 'robos', 'tasa', 'robo'],
        createTasaConfig('Robo a institución bancaria', TASA_STATS_ROBOS)],
];

const DELITOS_VIDA = [
    ['feminicidio', 'Feminicidio', 'delitos_fiscalia_feminicidio', ['seguridad', 'delito', 'feminicidio', 'tasa', 'mujer']],
    ['homicidio_doloso', 'Homicidio doloso', 'delitos_fiscalia_homicidio_doloso', ['seguridad', 'delito', 'homicidio', 'tasa', 'asesinato', 'crimen', 'violencia']],
    ['lesiones_dolosas', 'Lesiones dolosas', 'delitos_fiscalia_lesiones_dolosas', ['seguridad', 'delito', 'lesiones', 'dolosas', 'tasa', 'golpes', 'agresion', 'fisica']],
];

const DELITOS_LIBERTAD = [
    ['abuso_sexual_infantil', 'Abuso sexual infantil', 'delitos_fiscalia_abuso_sexual_infantil', ['seguridad', 'delito', 'abuso', 'sexual', 'infantil', 'tasa', 'violencia']],
    ['violacion', 'Violacion', 'delitos_fiscalia_violacion', ['seguridad', 'delito', 'violacion', 'tasa', 'sexual']],
];

const DELITOS_FAMILIA = [
    ['violencia_familiar', 'Violencia familiar', 'delitos_fiscalia_violencia_familiar', ['seguridad', 'delito', 'violencia', 'familiar', 'tasa', 'domestica']],
];

const DELITOS_PATRIMONIO = [
    ['robos_coche_cuatro_ruedas', 'Robo a vehículos particulares', 'delitos_fiscalia_robo_vehiculos_particulares', ['seguridad', 'delito', 'robos', 'tasa', 'robo']],
    ['robos_vehiculos_carga_pesada', 'Robo a vehículos de carga pesada', 'delitos_fiscalia_robo_carga_pesada', ['seguridad', 'delito', 'robos', 'tasa', 'robo']],
    ['robos_motocicleta', 'Robo de motocicletas', 'delitos_fiscalia_robo_motocicleta', ['seguridad', 'delito', 'robos', 'tasa', 'robo']],
    ['robos_personas', 'Robo a persona', 'delitos_fiscalia_robo_persona', ['seguridad', 'delito', 'robos', 'tasa', 'robo']],
    ['robos_casa_habitacion', 'Robo a casa habitación', 'delitos_fiscalia_robo_casa_habitacion', ['seguridad', 'delito', 'robos', 'tasa', 'robo']],
    ['robos_negocio', 'Robo a negocio', 'delitos_fiscalia_robo_negocio', ['seguridad', 'delito', 'robos', 'tasa', 'robo']],
    ['robos_autopartes', 'Robo de autopartes', 'delitos_fiscalia_robo_autopartes', ['seguridad', 'delito', 'robos', 'tasa', 'robo']],
    ['robo_interior_vehiculos', 'Robo a interior de vehículos', 'delitos_fiscalia_robo_int_vehiculos', ['seguridad', 'delito', 'robos', 'tasa', 'robo']],
    ['robo_cuentahabientes', 'Robo a cuentahabientes', 'delitos_fiscalia_robo_cuentahabientes', ['seguridad', 'delito', 'robos', 'tasa', 'robo']],
    ['robo_bancos', 'Robo a bancos', 'delitos_fiscalia_robo_bancos', ['seguridad', 'delito', 'robos', 'tasa', 'robo']],
];

const DESAPARECIDAS = [
    ['tasa_personas_desaparecidas', 'Personas desaparecidas (tasa)', 'personas_desaparecidas', 'tasa_total',
        ['seguridad', 'delito', 'desaparecidos', 'tasa', 'incidencia'],
        createMunicipioConfig({
            title: 'Personas desaparecidas (tasa)',
            text: desaparecidosText,
            stats: [
                { label: 'Total', field: 'total' },
                { label: 'Tasa total', field: 'tasa_total' },
                { label: 'Mujeres', field: 'total_mujeres' },
                { label: 'Tasa mujeres', field: 'tasa_mujeres' },
                { label: 'Hombres', field: 'total_hombres' },
                { label: 'Tasa hombres', field: 'tasa_hombres' },
            ]
        })],
    ['tasa_mujeres_desaparecidas', 'Mujeres desaparecidas (tasa)', 'mujeres_desaparecidas_tasa', 'tasa_mujeres',
        ['seguridad', 'delito', 'desaparecidos', 'tasa', 'incidencia'],
        createMunicipioConfig({
            title: 'Mujeres desaparecidas (tasa)',
            text: desaparecidosText,
            stats: [
                { label: 'Mujeres', field: 'total_mujeres' },
                { label: 'Tasa mujeres', field: 'tasa_mujeres' },
            ]
        })],
    ['tasa_hombres_desaparecidos', 'Hombres desaparecidos (tasa)', 'hombres_desaparecidos_tasa', 'tasa_hombres',
        ['seguridad', 'delito', 'desaparecidos', 'tasa', 'incidencia'],
        createMunicipioConfig({
            title: 'Hombres desaparecidos (tasa)',
            text: desaparecidosText,
            stats: [
                { label: 'Hombres', field: 'total_hombres' },
                { label: 'Tasa hombres', field: 'tasa_hombres' },
            ]
        })],
];

const LOCALIZADAS = [
    ['tasa_personas_localizadas', 'Personas localizadas (tasa)', 'personas_localizadas',
        ['seguridad', 'delito', 'localizadas', 'tasa', 'incidencia'],
        createMunicipioConfig({
            title: 'Personas localizadas (tasa)',
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
        })],
    ['tasa_mujeres_localizadas', 'Mujeres localizadas (tasa)', 'personas_localizadas_mujeres',
        ['seguridad', 'delito', 'localizadas', 'tasa', 'incidencia'],
        createMunicipioConfig({
            title: 'Mujeres localizadas (tasa)',
            text: desaparecidosText,
            stats: [
                { label: 'Mujeres', field: 'total_mujeres' },
                { label: 'Mujeres con vida', field: 'mujeres_con_vida' },
                { label: 'Mujeres sin vida', field: 'mujeres_sin_vida' },
                { label: 'Tasa mujeres', field: 'tasa_mujeres' },
            ]
        })],
    ['tasa_hombres_localizados', 'Hombres localizados (tasa)', 'personas_localizadas_hombres',
        ['seguridad', 'delito', 'localizadas', 'tasa', 'incidencia'],
        createMunicipioConfig({
            title: 'Hombres localizados (tasa)',
            text: desaparecidosText,
            stats: [
                { label: 'Hombres', field: 'total_hombres' },
                { label: 'Hombres con vida', field: 'hombres_con_vida' },
                { label: 'Hombres sin vida', field: 'hombres_sin_vida' },
                { label: 'Tasa hombres', field: 'tasa_hombres' },
            ]
        })],
];

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
                    id: 'tasa-vida-integridad',
                    label: 'Delitos contra la vida y la integridad corporal',
                    isLabel: true,
                    children: TASAS_DELITOS_FUERO.map(([id, label, layerName, tags, littleCard]) => ({
                        id, label,
                        wmsConfig: createSeguridadLayer(layerName),
                        defaultDate: TASA_DEFAULT_DATE,
                        littleCard,
                        searchMeta: { tags }
                    }))
                }, {
                    id: 'tasa-libertad-sexual',
                    label: 'Delitos contra la libertad y la seguridad sexual',
                    isLabel: true,
                    children: TASA_DELITOS_LIBERTAD.map(([id, label, layerName, tags, littleCard]) => ({
                        id, label,
                        wmsConfig: createSeguridadLayer(layerName),
                        defaultDate: TASA_DEFAULT_DATE,
                        littleCard,
                        searchMeta: { tags }
                    }))
                }, {
                    id: 'tasa-familia',
                    label: 'Delitos contra la familia',
                    isLabel: true,
                    children: TASA_DELITOS_FAMILIA.map(([id, label, layerName, tags, littleCard]) => ({
                        id, label,
                        wmsConfig: createSeguridadLayer(layerName),
                        defaultDate: TASA_DEFAULT_DATE,
                        littleCard,
                        searchMeta: { tags }
                    }))
                }, {
                    id: 'tasa-patrimonio',
                    label: 'Delitos contra el patrimonio',
                    isLabel: true,
                    children: TASA_DELITOS_PATRIMONIO.map(([id, label, layerName, tags, littleCard]) => ({
                        id, label,
                        wmsConfig: createSeguridadLayer(layerName),
                        defaultDate: TASA_DEFAULT_DATE,
                        littleCard,
                        searchMeta: { tags }
                    }))
                }
            ]
        }, {
            id: 'delitos_del_fuero_comun',
            label: 'Delitos del fuero común',
            isCategory: true,
            children: [{
                id: 'delito-vida-integridad',
                label: 'Delitos contra la vida y la integridad corporal',
                isLabel: true,
                children: DELITOS_VIDA.map(([id, label, layerName, tags]) => ({
                    id, label,
                    wmsConfig: createSeguridadLayer(layerName),
                    littleCard: delitoConfig,
                    searchMeta: { tags }
                }))
            }, {
                id: 'delito-libertad-sexual',
                label: 'Delitos contra la libertad y la seguridad sexual',
                isLabel: true,
                children: DELITOS_LIBERTAD.map(([id, label, layerName, tags]) => ({
                    id, label,
                    wmsConfig: createSeguridadLayer(layerName),
                    littleCard: delitoConfig,
                    searchMeta: { tags }
                }))
            }, {
                id: 'delito-familia',
                label: 'Delitos contra la familia',
                isLabel: true,
                children: DELITOS_FAMILIA.map(([id, label, layerName, tags]) => ({
                    id, label,
                    wmsConfig: createSeguridadLayer(layerName),
                    littleCard: delitoConfig,
                    searchMeta: { tags }
                }))
            }, {
                id: 'delito-patrimonio',
                label: 'Delitos contra el patrimonio',
                isLabel: true,
                children: DELITOS_PATRIMONIO.map(([id, label, layerName, tags]) => {
                    const config = { ...delitoRoboConfig, headerField: label };
                    return {
                        id, label,
                        forceGroup: true,
                        children: [
                            {
                                id: `${id}_con_violencia`,
                                label: 'Con violencia',
                                wmsConfig: createSeguridadLayer.withFilter(layerName, "modalidad = 'Con violencia'"),
                                littleCard: config,
                                searchMeta: { tags: [...tags, 'violencia'] }
                            },
                            {
                                id: `${id}_sin_violencia`,
                                label: 'Sin violencia',
                                wmsConfig: createSeguridadLayer.withFilter(layerName, "modalidad = 'Sin violencia'"),
                                littleCard: config,
                                searchMeta: { tags: [...tags, 'sin_violencia'] }
                            },
                            {
                                id: `${id}_sin_especificar`,
                                label: 'Sin especificar',
                                wmsConfig: createSeguridadLayer.withFilter(layerName, "modalidad IS NULL OR modalidad = ''"),
                                littleCard: config,
                                searchMeta: { tags: [...tags, 'sin_especificar'] }
                            }
                        ]
                    };
                })
            }]
        }, {
            id: 'personas-desaparecidas',
            label: 'Personas Desaparecidas',
            isCategory: true,
            children: [
                {
                    id: 'cat-personas-desaparecidas',
                    label: 'Personas desaparecidas',
                    isLabel: true,
                    children: DESAPARECIDAS.map(([id, label, style, not, tags, littleCard]) => ({
                        id, label,
                        wmsConfig: createSeguridadLayer.withFilterAndStyles('personas_desaparecidas', `${not} IS NOT NULL`, style, { metadataLayer: style }),
                        defaultDate: TASA_DEFAULT_DATE,
                        littleCard,
                        searchMeta: { tags }
                    }))
                }, {
                    id: 'cat-personas-localizadas',
                    label: 'Personas localizadas',
                    isLabel: true,
                    children: LOCALIZADAS.map(([id, label, layerName, tags, littleCard]) => ({
                        id, label,
                        wmsConfig: createSeguridadLayer(layerName),
                        defaultDate: TASA_DEFAULT_DATE,
                        littleCard,
                        searchMeta: { tags }
                    }))
                }
            ]
        }
    ]
};
