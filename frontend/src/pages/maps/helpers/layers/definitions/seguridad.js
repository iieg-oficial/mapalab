import { createLayerFactory } from '../utils/layerFactory';

const createSeguridadLayer = createLayerFactory('seguridad');

const createRoboConModalidad = (id, label, layerName, baseTags) => ({
    id,
    label,
    isLabel: true,
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

const seguridadConfig = {
    headerField: 'delito',
    labelGroups: [
        { fields: ['municipio', 'colonia'] }
    ],
    list: [
        { label: 'Fecha', field: 'fecha' },
        { label: 'Hora del delito', field: 'hora' },
        { label: 'Bien afectado', field: 'bien_afectado' },
    ],
    cards: [
        { label: 'Área del decreto', field: 'area_km2' },
        { label: 'Superficie', field: 'superficie' },
        { label: 'Tasa de carpetas investigadas', field: 'tasa_carpetas_investigacion' },
    ],
};

const PERSONAS_CARDS = {
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

const personasConfig = (tipo, whatIs) => ({
    headerField: 'nombre',
    labelGroups: [],
    list: [
        { label: 'Fecha', field: 'fecha' },
    ],
    cards: PERSONAS_CARDS[tipo]?.[whatIs] || [],
});

const DELITOS_STRUCTURE = [
    {
        id: 'cat-vida-integridad',
        label: 'Delitos contra la vida y la integridad corporal',
        isLabel: true,
        layers: [
            ['homicidio_doloso', 'Homicidio doloso', 'delitos_fiscalia_homicidio_doloso', ['seguridad', 'delito', 'homicidio', 'tasa', 'asesinato', 'crimen', 'violencia']],
            ['lesiones_dolosas', 'Lesiones dolosas', 'delitos_fiscalia_lesiones_dolosas', ['seguridad', 'delito', 'lesiones', 'dolosas', 'golpes', 'agresion', 'fisica']],
            ['feminicidio', 'Feminicidio', 'delitos_fiscalia_feminicidio', ['seguridad', 'delito', 'feminicidio', 'mujer', 'homicidio', 'genero', 'violencia']]
        ]
    }, {
        id: 'cat-patrimonio',
        label: 'Delitos contra el patrimonio',
        isLabel: true,
        layers: [
            createRoboConModalidad('robo_a_casa_habitacion', 'Robo a casa habitación', 'delitos_fiscalia_robo_casa_habitacion', ['seguridad', 'delito', 'robo', 'casa', 'hogar', 'vivienda', 'domicilio', 'habitacion', 'patrimonio']),
            createRoboConModalidad('robo_a_vehiculos_particulares', 'Robo a vehículos particulares', 'delitos_fiscalia_robo_vehiculos_particulares', ['seguridad', 'delito', 'robo', 'vehiculo', 'carro', 'auto', 'coche', 'particular']),
            createRoboConModalidad('robo_de_autopartes', 'Robo de autopartes', 'delitos_fiscalia_robo_autopartes', ['seguridad', 'delito', 'robo', 'vehiculo', 'autopartes', 'piezas', 'accesorios', 'llantas', 'espejos']),
            createRoboConModalidad('robo_a_vehiculos_de_carga_pesada', 'Robo a vehículos de carga pesada', 'delitos_fiscalia_robo_carga_pesada', ['seguridad', 'delito', 'robo', 'vehiculo', 'carga', 'camion', 'trailer', 'transporte', 'mercancia']),
            createRoboConModalidad('robo_a_persona', 'Robo a persona', 'delitos_fiscalia_robo_persona', ['seguridad', 'delito', 'robo', 'asalto', 'persona', 'transeunte', 'calle', 'via_publica']),
            createRoboConModalidad('robo_a_bancos', 'Robo a bancos', 'delitos_fiscalia_robo_bancos', ['seguridad', 'delito', 'robo', 'banco', 'asalto', 'financiero', 'sucursal']),
            createRoboConModalidad('robo_a_negocio', 'Robo a negocio', 'delitos_fiscalia_robo_negocio', ['seguridad', 'delito', 'robo', 'negocio', 'tienda', 'comercio', 'establecimiento', 'local']),
            createRoboConModalidad('robo_a_cuentahabientes', 'Robo a cuentahabientes', 'delitos_fiscalia_robo_cuentahabientes', ['seguridad', 'delito', 'robo', 'banco', 'cajero', 'cuenta', 'dinero', 'efectivo']),
            createRoboConModalidad('robo_a_interior_de_vehiculos', 'Robo a interior de vehículos', 'delitos_fiscalia_robo_int_vehiculos', ['seguridad', 'delito', 'robo', 'vehiculo', 'carro', 'auto', 'coche', 'interior', 'cristalazo']),
            createRoboConModalidad('robo_de_motocicletas', 'Robo de motocicletas', 'delitos_fiscalia_robo_motocicleta', ['seguridad', 'delito', 'robo', 'moto', 'motocicleta', 'vehiculo'])
        ]
    }, {
        id: 'cat-familia',
        label: 'Delitos contra la familia',
        isLabel: true,
        layers: [
            ['violencia_familiar', 'Violencia familiar', 'delitos_fiscalia_violencia_familiar', ['seguridad', 'delito', 'violencia', 'familia', 'domestica', 'intrafamiliar', 'genero', 'hogar']],
            ['violencia_de_genero', 'Violencia de género en todas sus modalidades distinta a la violencia familiar', 'datos_delitos_violencia_genero_no_familiar_secretariado', ['seguridad', 'delito', 'violencia', 'genero', 'feminicidio', 'mujer', 'homicidio', 'genero', 'violencia']],
        ]
    }, {
        id: 'cat-libertad-sexual',
        label: 'Delitos contra la libertad y la seguridad sexual',
        isLabel: true,
        layers: [
            ['abuso_sexual_infantil', 'Abuso sexual infantil', 'delitos_fiscalia_abuso_sexual_infantil', ['seguridad', 'delito', 'abuso', 'sexual', 'ninos', 'infantil', 'menores', 'pederastia']],
            ['violacion', 'Violación', 'delitos_fiscalia_violacion', ['seguridad', 'delito', 'violacion', 'sexual', 'abuso', 'agresion']]
        ]
    }
];

const TASAS_STRUCTURE = [
    {
        id: 'cat-tasa-vida-integridad',
        label: 'Delitos contra la vida y la integridad corporal',
        isLabel: true,
        layers: [
            ['tasa_homicidio_doloso', 'Homicidio doloso', 'datos_delitos_homicidio_doloso_secretariado', ['seguridad', 'delito', 'homicidio', 'tasa', 'asesinato', 'crimen', 'violencia']],
            ['tasa_lesiones_dolosas', 'Lesiones dolosas', 'datos_delitos_lesiones_dolosas_secretariado', ['seguridad', 'delito', 'lesiones', 'dolosas', 'tasa', 'golpes', 'agresion', 'fisica']],
            ['tasa_feminicidio', 'Feminicidio', 'datos_delitos_feminicidio_secretariado', ['seguridad', 'delito', 'feminicidio', 'tasa', 'mujer']]
        ]
    }, {
        id: 'cat-tasa-patrimonio',
        label: 'Delitos contra el patrimonio',
        isLabel: true,
        layers: [
            ['tasa_robo_casa_habitacion', 'Robo a casa habitación', 'datos_delitos_robo_casa_habitacion_secretariado', ['seguridad', 'delito', 'robo', 'casa', 'tasa', 'hogar']],
            ['tasa_robo_vehiculo_particular', 'Robo a vehículos particulares', 'datos_delitos_robo_coche_cuatro_ruedas_secretariado', ['seguridad', 'delito', 'robo', 'vehiculo', 'tasa', 'auto']],
            ['tasa_robo_autopartes', 'Robo de autopartes', 'datos_delitos_robo_autopartes_secretariado', ['seguridad', 'delito', 'robo', 'autopartes', 'tasa', 'piezas']],
            ['tasa_robo_vehiculo_carga_pesada', 'Robo a vehículos de carga pesada', 'datos_delitos_robo_transportista_secretariado', ['seguridad', 'delito', 'robo', 'carga', 'tasa', 'transporte']],
            ['tasa_robo_persona', 'Robo a persona', 'datos_delitos_robo_transeunte_via_publica_secretariado', ['seguridad', 'delito', 'robo', 'persona', 'tasa', 'asalto']],
            ['tasa_robo_bancos', 'Robo a bancos', 'datos_delitos_robo_institucion_bancaria_secretariado', ['seguridad', 'delito', 'robo', 'banco', 'tasa', 'asalto']],
            ['tasa_robo_negocio', 'Robo a negocio', 'datos_delitos_robo_negocio_secretariado', ['seguridad', 'delito', 'robo', 'negocio', 'tasa', 'comercio']],
            ['tasa_robo_cuentahabientes', '*Robo a cuentahabientes', 'incidencia_robo_cuentahabientes', ['seguridad', 'delito', 'robo', 'banco', 'tasa', 'cajero']],
            ['tasa_robo_interior_vehiculos', '*Robo a interior de vehículos', 'incidencia_robo_interior_vehiculos', ['seguridad', 'delito', 'robo', 'vehiculo', 'tasa', 'interior']],
            ['tasa_robo_motocicleta', 'Robo de motocicletas', 'datos_delitos_robo_motocicleta_secretariado', ['seguridad', 'delito', 'robo', 'moto', 'tasa', 'motocicleta']]
        ]
    }, {
        id: 'cat-tasa-familia',
        label: 'Delitos contra la familia',
        isLabel: true,
        layers: [
            ['tasa_violencia_familiar', 'Violencia familiar', 'datos_delitos_violencia_familiar_secretariado', ['seguridad', 'delito', 'violencia', 'familia', 'tasa', 'domestica']]
        ]
    }, {
        id: 'cat-tasa-libertad-sexual',
        label: 'Delitos contra la libertad y la seguridad sexual',
        isLabel: true,
        layers: [
            ['tasa_abuso_sexual_infantil', 'Abuso sexual infantil', 'datos_delitos_abuso_sexual_secretariado', ['seguridad', 'delito', 'abuso', 'sexual', 'tasa', 'infantil']],
            ['tasa_violacion', 'Violación', 'datos_delitos_violacion_secretariado', ['seguridad', 'delito', 'violacion', 'tasa', 'sexual']]
        ]
    }
];

export const seguridadLayers = {
    id: 'seguridad',
    label: 'Seguridad',
    children: [
        {
            id: 'delitos-fuero-comun',
            label: 'Delitos del Fuero Común',
            base: 'inegi',
            isCategory: true,
            children: DELITOS_STRUCTURE.map(cat => ({
                id: cat.id,
                label: cat.label,
                isLabel: cat.isLabel,
                isCategory: !cat.isLabel,
                children: cat.layers.map(layer => {
                    if (Array.isArray(layer)) {
                        const [id, label, layerName, tags] = layer;
                        return {
                            id,
                            label,
                            wmsConfig: createSeguridadLayer(layerName),
                            littleCard: seguridadConfig,
                            searchMeta: { tags }
                        };
                    }
                    return {
                        id: layer.id,
                        label: layer.label,
                        isLabel: layer.isLabel,
                        children: layer.children.map(child => ({
                            id: child.id,
                            label: child.label,
                            wmsConfig: createSeguridadLayer.withFilter(layer.layerName, child.filter),
                            littleCard: seguridadConfig,
                            searchMeta: { tags: [...layer.baseTags, ...child.tags] }
                        }))
                    };
                })
            }))
        }, {
            id: 'Tasa_incidencia_delitos_del_fuero_comun',
            label: 'Tasa de incidencia delitos del fuero común',
            base: 'inegi',
            isCategory: true,
            children: TASAS_STRUCTURE.map(cat => ({
                id: cat.id,
                label: cat.label,
                isLabel: cat.isLabel,
                isCategory: !cat.isLabel,
                children: cat.layers.map(([id, label, layerName, tags]) => ({
                    id,
                    label,
                    wmsConfig: createSeguridadLayer(layerName),
                    littleCard: seguridadConfig,
                    searchMeta: { tags }
                }))
            }))
        }, {
            id: 'personas-desaparecidas',
            label: 'Personas Desaparecidas',
            base: 'inegi',
            isCategory: true,
            children: [
                {
                    id: 'tasa_personas_desaparecidas',
                    label: 'Personas desaparecidas',
                    wmsConfig: createSeguridadLayer('personas_desaparecidas'),
                    littleCard: personasConfig('desaparecidos', 'total'),
                    searchMeta: { tags: ['seguridad', 'desaparecidos', 'personas', 'tasa', 'incidencia'] },
                    children: [
                        {
                            id: 'tasa_hombres_desaparecidos',
                            label: 'Hombres',
                            wmsConfig: createSeguridadLayer.withFilterAndStyles('personas_desaparecidas', 'tasa_hombres IS NOT NULL', 'desaparecidos_hombres'),
                            littleCard: personasConfig('desaparecidos', 'hombres'),
                            searchMeta: { tags: ['seguridad', 'desaparecidos', 'hombres', 'personas', 'tasa', 'incidencia'] }
                        }, {
                            id: 'tasa_mujeres_desaparecidas',
                            label: 'Mujeres',
                            wmsConfig: createSeguridadLayer.withFilterAndStyles('personas_desaparecidas', 'tasa_mujeres IS NOT NULL', 'desaparecidos_mujeres'),
                            littleCard: personasConfig('desaparecidos', 'mujeres'),
                            searchMeta: { tags: ['seguridad', 'desaparecidos', 'mujeres', 'personas', 'tasa', 'incidencia'] }
                        }
                    ]
                }, {
                    id: 'tasa_personas_localizadas',
                    label: 'Personas localizadas',
                    wmsConfig: createSeguridadLayer('personas_localizadas'),
                    littleCard: personasConfig('localizados', 'total'),
                    searchMeta: { tags: ['seguridad', 'localizados', 'personas', 'tasa', 'incidencia'] },
                    children: [
                        {
                            id: 'tasa_hombres_localizadas',
                            label: 'Hombres',
                            wmsConfig: createSeguridadLayer.withFilterAndStyles('personas_localizadas', 'tasa_hombres IS NOT NULL', 'localizados_hombres'),
                            littleCard: personasConfig('localizados', 'hombres'),
                            searchMeta: { tags: ['seguridad', 'localizados', 'hombres', 'personas', 'tasa', 'incidencia'] }
                        }, {
                            id: 'tasa_mujeres_localizadas',
                            label: 'Mujeres',
                            wmsConfig: createSeguridadLayer.withFilterAndStyles('personas_localizadas', 'tasa_mujeres IS NOT NULL', 'localizados_mujeres'),
                            littleCard: personasConfig('localizados', 'mujeres'),
                            searchMeta: { tags: ['seguridad', 'localizados', 'mujeres', 'personas', 'tasa', 'incidencia'] }
                        }
                    ]
                }
            ]
        }
    ]
};