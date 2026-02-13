import { createLayerFactory } from '../utils/layerFactory';
import { cardTemplates } from '../../../components/InfoBox/utils/cardTemplates';

const createSeguridadLayer = createLayerFactory('seguridad');

const createRoboConModalidad = (id, label, layerName, baseTags) => ({
    id,
    label,
    isLabel: true,
    forceGroup: true,
    layerName,
    baseTags,
    children: [
        {
            id: `${id}_con_violencia`,
            label: 'Con violencia',
            filter: "modalidad = 'Con violencia'",
            tags: ['violencia']
        }, {
            id: `${id}_sin_violencia`,
            label: 'Sin violencia',
            filter: "modalidad = 'Sin violencia'",
            tags: []
        }, {
            id: `${id}_sin_especificar`,
            label: 'Sin especificar',
            filter: "modalidad IS NULL OR modalidad = ''",
            tags: []
        }
    ]
});

const seguridadConfig = cardTemplates.TDEMLEV({
    title: 'delito',
    municipio: ['municipio', 'colonia'],
    list: [
        { label: 'Fecha', field: 'fecha' },
        { label: 'Hora del delito', field: 'hora' },
        { label: 'Bien afectado', field: 'bien_afectado' },
    ],
    stats: [
        { label: 'Área del decreto', field: 'area_km2' },
        { label: 'Superficie', field: 'superficie' },
        { label: 'Tasa de carpetas investigadas', field: 'tasa_carpetas_investigacion' },
        { field: 'modalidad' },
    ]
});

const PERSONAS_STATS = {
    desaparecidos: {
        total: [
            { label: 'Total desaparecidos', field: 'total' },
            { label: 'Tasa total', field: 'tasa_total', suffix: '%' },
        ],
        hombres: [
            { label: 'Total hombres desaparecidos', field: 'total_hombres' },
            { label: 'Tasa hombres desaparecidos', field: 'tasa_hombres', suffix: '%' },
        ],
        mujeres: [
            { label: 'Total mujeres desaparecidas', field: 'total_mujeres' },
            { label: 'Tasa mujeres desaparecidas', field: 'tasa_mujeres', suffix: '%' },
        ],
    },
    localizados: {
        total: [
            { label: 'Total localizados', field: 'total' },
            { label: 'Tasa total', field: 'tasa_total', suffix: '%' },
        ],
        hombres: [
            { label: 'Total hombres localizados', field: 'total_hombres' },
            { label: 'Tasa hombres localizados', field: 'tasa_hombres', suffix: '%' },
        ],
        mujeres: [
            { label: 'Total mujeres localizadas', field: 'total_mujeres' },
            { label: 'Tasa mujeres localizadas', field: 'tasa_mujeres', suffix: '%' },
        ],
    },
};

const personasConfig = (tipo, whatIs) => cardTemplates.TDLEV({
    title: 'nombre',
    list: [
        { label: 'Fecha', field: 'fecha' },
    ],
    stats: PERSONAS_STATS[tipo]?.[whatIs] || []
});

const TASAS_DELITOS_FUERO = [
    { id: 'tasa_feminicidio', label: 'Feminicidios (tasa)', layerName: 'datos_delitos_feminicidio_secretariado', tags: ['seguridad', 'delito', 'feminicidio', 'tasa', 'mujer'] },
    { id: 'tasa_homicidio_doloso', label: 'Homicidio doloso (tasa)', layerName: 'datos_delitos_homicidio_doloso_secretariado', tags: ['seguridad', 'delito', 'homicidio', 'tasa', 'asesinato', 'crimen', 'violencia'] },
    { id: 'tasa_lesiones_dolosas', label: 'Lesiones dolosas (tasa)', layerName: 'datos_delitos_lesiones_dolosas_secretariado', tags: ['seguridad', 'delito', 'lesiones', 'dolosas', 'tasa', 'golpes', 'agresion', 'fisica'] },
];

const TASA_DELITOS_LIBERTAD = [
    { id: 'tasa_violacion', label: 'Violación (tasa)', layerName: 'datos_delitos_violacion_secretariado', tags: ['seguridad', 'delito', 'violacion', 'tasa', 'sexual'] },
    { id: 'tasa_abuso_sexual', label: 'Abuso sexual (tasa)', layerName: 'datos_delitos_abuso_sexual_secretariado', tags: ['seguridad', 'delito', 'abuso', 'sexual', 'tasa', 'infantil'] },
];

const TASA_DELITOS_FAMILIA = [
    { id: 'tasa_violencia_de_genero', label: 'Violencia de género (tasa)', layerName: 'datos_delitos_violencia_de_genero_secretariado', tags: ['seguridad', 'delito', 'violencia', 'genero', 'tasa', 'domestica'] },
    { id: 'tasa_violencia_familiar', label: 'Violencia familiar (tasa)', layerName: 'datos_delitos_violencia_familiar_secretariado', tags: ['seguridad', 'delito', 'violencia', 'familia', 'tasa', 'domestica'] },
];

const TASA_DELITOS_PATRIMONIO = [
    { id: 'tasa_robos_coche_cuatro_ruedas', label: 'Robo de coche a cuatro ruedas (tasa)', layerName: 'datos_delitos_robos_coche_cuatro_ruedas_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
    { id: 'tasa_robos_transportistas', label: 'Robo de transportistas (tasa)', layerName: 'datos_delitos_robos_transportistas_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
    { id: 'tasa_robos_motocicleta', label: 'Robo de motocicleta (tasa)', layerName: 'datos_delitos_robos_motocicleta_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
    { id: 'tasa_robos_personas', label: 'Robo a personas (tasa)', layerName: 'datos_delitos_robos_personas_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
    { id: 'tasa_robos_casa_habitacion', label: 'Robo a casa habitacion (tasa)', layerName: 'datos_delitos_robos_casa_habitacion_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
    { id: 'tasa_robos_negocio', label: 'Robo a negocio (tasa)', layerName: 'datos_delitos_robos_negocio_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
    { id: 'tasa_robos_autopartes', label: 'Robo de autopartes (tasa)', layerName: 'datos_delitos_robos_autopartes_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
    { id: 'tasa_robos_instituciones_bancarias', label: 'Robo a instituciones bancarias (tasa)', layerName: 'datos_delitos_robos_instituciones_bancarias_secretariado', tags: ['seguridad', 'delito', 'robos', 'tasa', 'robo'] },
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
    { id: 'tasa_personas_desaparecidas', label: 'Personas desaparecidas (tasa)', style: 'personas_desaparecidas_total', not: 'tasa_personas', tags: ['seguridad', 'delito', 'desaparecidos', 'tasa', 'incidencia'] },
    { id: 'tasa_mujeres_desaparecidas', label: 'Mujeres desaparecidas (tasa)', style: 'desaparecidos_mujeres', not: 'tasa_mujeres', tags: ['seguridad', 'delito', 'desaparecidos', 'tasa', 'incidencia'] },
    { id: 'tasa_hombres_desaparecidos', label: 'Hombres desaparecidos (tasa)', style: 'desaparecidos_hombres', not: 'tasa_hombres', tags: ['seguridad', 'delito', 'desaparecidos', 'tasa', 'incidencia'] },
];

const LOCALIZADAS = [
    { id: 'tasa_personas_localizadas', label: 'Personas localizadas (tasa)', layerName: 'personas_localizadas', tags: ['seguridad', 'delito', 'localizadas', 'tasa', 'incidencia'] },
    { id: 'tasa_mujeres_localizadas', label: 'Mujeres localizadas (tasa)', layerName: 'personas_localizadas_mujeres', tags: ['seguridad', 'delito', 'localizadas', 'tasa', 'incidencia'] },
    { id: 'tasa_hombres_localizados', label: 'Hombres localizados (tasa)', layerName: 'personas_localizadas_hombres', tags: ['seguridad', 'delito', 'localizadas', 'tasa', 'incidencia'] },
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
                    id: 'cat-vida-integridad',
                    label: 'Delitos contra la vida y la integridad corporal',
                    isLabel: true,
                    children: TASAS_DELITOS_FUERO.map(({ id, label, layerName, tags }) => ({
                        id,
                        label,
                        wmsConfig: createSeguridadLayer(layerName),
                        littleCard: seguridadConfig,
                        searchMeta: { tags }
                    }))
                }, {
                    id: 'cat-libertad-sexual',
                    label: 'Delitos contra la libertad y la seguridad sexual',
                    isLabel: true,
                    children: TASA_DELITOS_LIBERTAD.map(({ id, label, layerName, tags }) => ({
                        id,
                        label,
                        wmsConfig: createSeguridadLayer(layerName),
                        littleCard: seguridadConfig,
                        searchMeta: { tags }
                    }))
                }, {
                    id: 'cat-familia',
                    label: 'Delitos contra la familia',
                    isLabel: true,
                    children: TASA_DELITOS_FAMILIA.map(({ id, label, layerName, tags }) => ({
                        id,
                        label,
                        wmsConfig: createSeguridadLayer(layerName),
                        littleCard: seguridadConfig,
                        searchMeta: { tags }
                    }))
                }, {
                    id: 'cat-patrimonio',
                    label: 'Delitos contra el patrimonio',
                    isLabel: true,
                    children: TASA_DELITOS_PATRIMONIO.map(({ id, label, layerName, tags }) => ({
                        id,
                        label,
                        wmsConfig: createSeguridadLayer(layerName),
                        littleCard: seguridadConfig,
                        searchMeta: { tags }
                    }))
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
                children: DELITOS_VIDA.map(({ id, label, layerName, tags }) => ({
                    id,
                    label,
                    wmsConfig: createSeguridadLayer(layerName),
                    littleCard: seguridadConfig,
                    searchMeta: { tags }
                }))
            }, {
                id: 'cat-libertad-sexual',
                label: 'Delitos contra la libertad y la seguridad sexual',
                isLabel: true,
                children: DELITOS_LIBERTAD.map(({ id, label, layerName, tags }) => ({
                    id,
                    label,
                    wmsConfig: createSeguridadLayer(layerName),
                    littleCard: seguridadConfig,
                    searchMeta: { tags }
                }))
            }, {
                id: 'cat-familia',
                label: 'Delitos contra la familia',
                isLabel: true,
                children: DELITOS_FAMILIA.map(({ id, label, layerName, tags }) => ({
                    id,
                    label,
                    wmsConfig: createSeguridadLayer(layerName),
                    littleCard: seguridadConfig,
                    searchMeta: { tags }
                }))
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
                            littleCard: seguridadConfig,
                            searchMeta: { tags: [...tags, 'violencia'] }
                        },
                        {
                            id: `${id}_sin_violencia`,
                            label: 'Sin violencia',
                            wmsConfig: createSeguridadLayer.withFilter(layerName, "modalidad = 'Sin violencia'"),
                            littleCard: seguridadConfig,
                            searchMeta: { tags: [...tags, 'sin_violencia'] }
                        },
                        {
                            id: `${id}_sin_especificar`,
                            label: 'Sin especificar',
                            wmsConfig: createSeguridadLayer.withFilter(layerName, "modalidad IS NULL OR modalidad = ''"),
                            littleCard: seguridadConfig,
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
                    children: DESAPARECIDAS.map(({ id, label, style, not, tags }) => ({
                        id,
                        label,
                        wmsConfig: createSeguridadLayer.withFilterAndStyles('personas_desaparecidas', `${not} IS NOT NULL`, style),
                        littleCard: personasConfig('desaparecidos', 'total'),
                        searchMeta: { tags }
                    }))
                }, {
                    id: 'cat-personas-localizadas',
                    label: 'Personas localizadas',
                    isLabel: true,
                    children: LOCALIZADAS.map(({ id, label, layerName, tags }) => ({
                        id,
                        label,
                        wmsConfig: createSeguridadLayer(layerName),
                        littleCard: personasConfig('localizados', 'total'),
                        searchMeta: { tags }
                    }))
                }
            ]
        }
    ]
};