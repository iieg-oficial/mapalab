import { createLayerFactory } from '../utils/layerFactory';

const createSeguridadLayer = createLayerFactory('seguridad');

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

const desaparecidosConfig = {
    headerField: 'municipio',
    labelGroups: [
        { fields: ['colonia'] }
    ],
    list: [
        { label: 'Fecha', field: 'fecha' },
    ],
    cards: [
        { label: 'Tasa de hombres desaparecidos', field: 'tasa_hombres' },
        { label: 'Tasa de mujeres desaparecidas', field: 'tasa_mujeres' },
        { label: 'Tasa total', field: 'tasa_total' },
    ],
};

const DELITOS_STRUCTURE = [
    {
        id: 'cat-vida-integridad',
        label: 'Delitos contra la vida y la integridad corporal',
        layers: [
            ['homicidio_doloso', 'Homicidio doloso', 'delitos_fiscalia_homicidio_doloso', ['seguridad', 'delito', 'homicidio', 'tasa', 'asesinato', 'crimen', 'violencia']],
            ['lesiones_dolosas', 'Lesiones dolosas', 'delitos_fiscalia_lesiones_dolosas', ['seguridad', 'delito', 'lesiones', 'dolosas', 'golpes', 'agresion', 'fisica']],
            ['feminicidio', 'Feminicidio', 'delitos_fiscalia_feminicidio', ['seguridad', 'delito', 'feminicidio', 'mujer', 'homicidio', 'genero', 'violencia']]
        ]
    }, {
        id: 'cat-patrimonio',
        label: 'Delitos contra el patrimonio',
        layers: [
            ['robo_a_casa_habitacion', 'Robo a casa habitación', 'delitos_fiscalia_robo_casa_habitacion', ['seguridad', 'delito', 'robo', 'casa', 'hogar', 'vivienda', 'domicilio', 'habitacion', 'patrimonio']],
            ['robo_a_vehiculos_particulares', 'Robo a vehículos particulares', 'delitos_fiscalia_robo_vehiculos_particulares', ['seguridad', 'delito', 'robo', 'vehiculo', 'carro', 'auto', 'coche', 'particular']],
            ['robo_de_autopartes', 'Robo de autopartes', 'delitos_fiscalia_robo_autopartes', ['seguridad', 'delito', 'robo', 'vehiculo', 'autopartes', 'piezas', 'accesorios', 'llantas', 'espejos']],
            ['robo_a_vehiculos_de_carga_pesada', 'Robo a vehículos de carga pesada', 'delitos_fiscalia_robo_carga_pesada', ['seguridad', 'delito', 'robo', 'vehiculo', 'carga', 'camion', 'trailer', 'transporte', 'mercancia']],
            ['robo_a_persona', 'Robo a persona', 'delitos_fiscalia_robo_persona', ['seguridad', 'delito', 'robo', 'asalto', 'persona', 'transeunte', 'calle', 'via_publica']],
            ['robo_a_bancos', 'Robo a bancos', 'delitos_fiscalia_robo_bancos', ['seguridad', 'delito', 'robo', 'banco', 'asalto', 'financiero', 'sucursal']],
            ['robo_a_negocio', 'Robo a negocio', 'delitos_fiscalia_robo_negocio', ['seguridad', 'delito', 'robo', 'negocio', 'tienda', 'comercio', 'establecimiento', 'local']],
            ['robo_a_cuentahabientes', 'Robo a cuentahabientes', 'delitos_fiscalia_robo_cuentahabientes', ['seguridad', 'delito', 'robo', 'banco', 'cajero', 'cuenta', 'dinero', 'efectivo']],
            ['robo_a_interior_de_vehiculos', 'Robo a interior de vehículos', 'delitos_fiscalia_robo_int_vehiculos', ['seguridad', 'delito', 'robo', 'vehiculo', 'carro', 'auto', 'coche', 'interior', 'cristalazo']],
            ['robo_de_motocicletas', 'Robo de motocicletas', 'delitos_fiscalia_robo_motocicleta', ['seguridad', 'delito', 'robo', 'moto', 'motocicleta', 'vehiculo']]
        ]
    }, {
        id: 'cat-familia',
        label: 'Delitos contra la familia',
        layers: [
            ['violencia_familiar', 'Violencia familiar', 'delitos_fiscalia_violencia_familiar', ['seguridad', 'delito', 'violencia', 'familia', 'domestica', 'intrafamiliar', 'genero', 'hogar']]
        ]
    }, {
        id: 'cat-libertad-sexual',
        label: 'Delitos contra la libertad y la seguridad sexual',
        layers: [
            ['abuso_sexual_infantil', 'Abuso sexual infantil', 'delitos_fiscalia_abuso_sexual_infantil', ['seguridad', 'delito', 'abuso', 'sexual', 'ninos', 'infantil', 'menores', 'pederastia']],
            ['violacion', 'Violación', 'delitos_fiscalia_violacion', ['seguridad', 'delito', 'violacion', 'sexual', 'abuso', 'agresion']]
        ]
    }
];

const TASAS_STRUCTURE = [
    {
        id: 'cat-tasa-vida-integridad',
        label: 'Delitos contra la vida y la integridad corporal (tasa)',
        layers: [
            ['tasa_homicidio_doloso', 'Tasa Homicidio doloso', 'datos_delitos_homicidio_doloso_secretariado', ['seguridad', 'delito', 'homicidio', 'tasa', 'asesinato', 'crimen', 'violencia']],
            ['tasa_lesiones_dolosas', 'Tasa Lesiones dolosas', 'datos_delitos_lesiones_dolosas_secretariado', ['seguridad', 'delito', 'lesiones', 'dolosas', 'tasa', 'golpes', 'agresion', 'fisica']],
            ['tasa_feminicidio', 'Tasa Feminicidio', 'datos_delitos_feminicidio_secretariado', ['seguridad', 'delito', 'feminicidio', 'tasa', 'mujer']]
        ]
    }, {
        id: 'cat-tasa-patrimonio',
        label: 'Delitos contra el patrimonio (tasa)',
        layers: [
            ['tasa_robo_casa_habitacion', 'Tasa Robo a casa habitación', 'datos_delitos_robo_casa_habitacion_secretariado', ['seguridad', 'delito', 'robo', 'casa', 'tasa', 'hogar']],
            ['tasa_robo_vehiculo_particular', 'Tasa Robo a vehículos particulares', 'datos_delitos_robo_coche_cuatro_ruedas_secretariado', ['seguridad', 'delito', 'robo', 'vehiculo', 'tasa', 'auto']],
            ['tasa_robo_autopartes', 'Tasa Robo de autopartes', 'datos_delitos_robo_autopartes_secretariado', ['seguridad', 'delito', 'robo', 'autopartes', 'tasa', 'piezas']],
            ['tasa_robo_vehiculo_carga_pesada', 'Tasa Robo a vehículos de carga pesada', 'datos_delitos_robo_transportista_secretariado', ['seguridad', 'delito', 'robo', 'carga', 'tasa', 'transporte']],
            ['tasa_robo_persona', 'Tasa Robo a persona', 'datos_delitos_robo_transeunte_via_publica_secretariado', ['seguridad', 'delito', 'robo', 'persona', 'tasa', 'asalto']],
            ['tasa_robo_bancos', 'Tasa Robo a bancos', 'datos_delitos_robo_institucion_bancaria_secretariado', ['seguridad', 'delito', 'robo', 'banco', 'tasa', 'asalto']],
            ['tasa_robo_negocio', 'Tasa Robo a negocio', 'datos_delitos_robo_negocio_secretariado', ['seguridad', 'delito', 'robo', 'negocio', 'tasa', 'comercio']],
            ['tasa_robo_cuentahabientes', '*Tasa Robo a cuentahabientes', 'incidencia_robo_cuentahabientes', ['seguridad', 'delito', 'robo', 'banco', 'tasa', 'cajero']],
            ['tasa_robo_interior_vehiculos', '*Tasa Robo a interior de vehículos', 'incidencia_robo_interior_vehiculos', ['seguridad', 'delito', 'robo', 'vehiculo', 'tasa', 'interior']],
            ['tasa_robo_motocicleta', 'Tasa Robo de motocicletas', 'datos_delitos_robo_motocicleta_secretariado', ['seguridad', 'delito', 'robo', 'moto', 'tasa', 'motocicleta']]
        ]
    }, {
        id: 'cat-tasa-familia',
        label: 'Delitos contra la familia',
        layers: [
            ['tasa_violencia_familiar', 'Tasa Violencia familiar', 'datos_delitos_violencia_familiar_secretariado', ['seguridad', 'delito', 'violencia', 'familia', 'tasa', 'domestica']]
        ]
    }, {
        id: 'cat-tasa-libertad-sexual',
        label: 'Delitos contra la libertad y la seguridad sexual',
        layers: [
            ['tasa_abuso_sexual_infantil', 'Tasa Abuso sexual infantil', 'datos_delitos_abuso_sexual_secretariado', ['seguridad', 'delito', 'abuso', 'sexual', 'tasa', 'infantil']],
            ['tasa_violacion', 'Tasa Violación', 'datos_delitos_violacion_secretariado', ['seguridad', 'delito', 'violacion', 'tasa', 'sexual']]
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
            children: DELITOS_STRUCTURE.map(cat => ({
                id: cat.id,
                label: cat.label,
                isCategory: true,
                children: cat.layers.map(([id, label, layerName, tags]) => ({
                    id,
                    label,
                    wmsConfig: createSeguridadLayer(layerName),
                    littleCard: seguridadConfig,
                    searchMeta: { tags }
                }))
            }))
        }, {
            id: 'Tasa_incidencia_delitos_del_fuero_comun',
            label: 'Tasa de incidencia delitos del fuero común',
            base: 'inegi',
            children: TASAS_STRUCTURE.map(cat => ({
                id: cat.id,
                label: cat.label,
                isCategory: true,
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
            children: [
                {
                    id: 'tasa_personas_desaparecidas',
                    label: 'Personas desaparecidas',
                    isCategory: true,
                    children: [
                        {
                            id: 'tasa_hombres_desaparecidos',
                            label: 'Tasa de hombres desaparecidos',
                            wmsConfig: createSeguridadLayer.withStyles('personas_desaparecidas', 'desaparecidos_hombres'),
                            littleCard: desaparecidosConfig,
                            searchMeta: { tags: ['seguridad', 'desaparecidos', 'hombres'] }
                        }, {
                            id: 'tasa_mujeres_desaparecidas',
                            label: 'Tasa de mujeres desaparecidas',
                            wmsConfig: createSeguridadLayer('personas_desaparecidas'),
                            littleCard: desaparecidosConfig,
                            searchMeta: { tags: ['seguridad', 'desaparecidos', 'mujeres'] }
                        }
                    ]
                }, {
                    id: 'tasa_personas_localizadas',
                    label: 'Personas localizadas',
                    isCategory: true,
                    children: [
                        {
                            id: 'tasa_hombres_localizados',
                            label: 'Tasa de hombres localizados',
                            wmsConfig: createSeguridadLayer.withFilter('tasa_personas_localizadas', "delito = 'tasa_hombres_localizados'"),
                            littleCard: desaparecidosConfig,
                            searchMeta: { tags: ['seguridad', 'localizados', 'hombres'] }
                        }, {
                            id: 'tasa_mujeres_localizadas',
                            label: 'Tasa de mujeres localizadas',
                            wmsConfig: createSeguridadLayer.withFilter('tasa_personas_localizadas', "delito = 'tasa_mujeres_localizadas'"),
                            littleCard: desaparecidosConfig,
                            searchMeta: { tags: ['seguridad', 'localizados', 'mujeres'] }
                        }
                    ]
                }
            ]
        }
    ]
};