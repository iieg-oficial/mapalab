import { createLayerFactory } from '../utils/layerFactory';

const createSeguridadLayer = createLayerFactory('seguridad');

const DELITOS_FUERO_COMUN = [
    ['robo_a_bancos', 'Robo a bancos', 'Robo a bancos', ['seguridad', 'delito', 'robo', 'banco', 'asalto', 'financiero', 'sucursal']],
    ['robo_a_casa_habitacion', 'Robo a casa habitación', 'Robo casa habitacion', ['seguridad', 'delito', 'robo', 'casa', 'hogar', 'vivienda', 'domicilio', 'habitacion', 'patrimonio']],
    ['robo_a_vehiculos_de_carga_pesada', 'Robo a vehículos de carga pesada', 'Robo a carga pesada', ['seguridad', 'delito', 'robo', 'vehiculo', 'carga', 'camion', 'trailer', 'transporte', 'mercancia']],
    ['robo_a_cuentahabientes', 'Robo a cuentahabientes', 'Robo a cuentahabientes', ['seguridad', 'delito', 'robo', 'banco', 'cajero', 'cuenta', 'dinero', 'efectivo']],
    ['robo_a_interior_de_vehiculos', 'Robo a interior de vehículos', 'Robo a int de vehiculos', ['seguridad', 'delito', 'robo', 'vehiculo', 'carro', 'auto', 'coche', 'interior', 'cristalazo']],
    ['robo_a_negocio', 'Robo a negocio', 'Robo a negocio', ['seguridad', 'delito', 'robo', 'negocio', 'tienda', 'comercio', 'establecimiento', 'local']],
    ['robo_a_persona', 'Robo a persona', 'Robo a persona', ['seguridad', 'delito', 'robo', 'asalto', 'persona', 'transeunte', 'calle', 'via_publica']],
    ['robo_a_vehiculos_particulares', 'Robo a vehículos particulares', 'Robo a vehiculos particulares', ['seguridad', 'delito', 'robo', 'vehiculo', 'carro', 'auto', 'coche', 'particular']],
    ['robo_de_autopartes', 'Robo de autopartes', 'Robo de autopartes', ['seguridad', 'delito', 'robo', 'vehiculo', 'autopartes', 'piezas', 'accesorios', 'llantas', 'espejos']],
    ['robo_de_motocicletas', 'Robo de motocicletas', 'Robo de motocicleta', ['seguridad', 'delito', 'robo', 'moto', 'motocicleta', 'vehiculo']],
    ['violencia_familiar', 'Violencia familiar', 'Violencia familiar', ['seguridad', 'delito', 'violencia', 'familia', 'domestica', 'intrafamiliar', 'genero', 'hogar']],
    ['abuso_sexual_infantil', 'Abuso sexual infantil', 'Abuso sexual infantil', ['seguridad', 'delito', 'abuso', 'sexual', 'ninos', 'infantil', 'menores', 'pederastia']],
    ['violacion', 'Violación', 'Violacion', ['seguridad', 'delito', 'violacion', 'sexual', 'abuso', 'agresion']],
    ['feminicidio', 'Feminicidio', 'Feminicidio', ['seguridad', 'delito', 'feminicidio', 'mujer', 'homicidio', 'genero', 'violencia']],
    ['lesiones_dolosas', 'Lesiones dolosas', 'Lesiones dolosas', ['seguridad', 'delito', 'lesiones', 'dolosas', 'golpes', 'agresion', 'fisica']],
    ['homicidio_doloso', 'Homicidio doloso', 'Homicidio doloso', ['seguridad', 'delito', 'homicidio', 'tasa', 'asesinato', 'crimen', 'violencia']],
];

const TASAS_DELITOS_FUERO_COMUN = [
    ['tasa_homicidio_doloso', 'Tasa Homicidio doloso', 'datos_delitos_homicidio_doloso_secretariado', ['seguridad', 'delito', 'homicidio', 'tasa', 'asesinato', 'crimen', 'violencia']],
    ['tasa_lesiones_dolosas', 'Tasa Lesiones dolosas', 'datos_delitos_lesiones_dolosas_secretariado', ['seguridad', 'delito', 'lesiones', 'dolosas', 'tasa', 'golpes', 'agresion', 'fisica']],
    ['tasa_robo_bancos', 'Tasa Robo a bancos', 'datos_delitos_robo_institucion_bancaria_secretariado', ['seguridad', 'delito', 'robo', 'banco', 'tasa', 'asalto']],
    ['tasa_robo_casa_habitacion', 'Tasa Robo a casa habitación', 'datos_delitos_robo_casa_habitacion_secretariado', ['seguridad', 'delito', 'robo', 'casa', 'tasa', 'hogar']],
    ['tasa_robo_vehiculo_carga_pesada', 'Tasa Robo a vehículos de carga pesada', 'datos_delitos_robo_transportista_secretariado', ['seguridad', 'delito', 'robo', 'carga', 'tasa', 'transporte']],
    ['tasa_robo_cuentahabientes', '*Tasa Robo a cuentahabientes', 'incidencia_robo_cuentahabientes', ['seguridad', 'delito', 'robo', 'banco', 'tasa', 'cajero']],
    ['tasa_robo_interior_vehiculos', '*Tasa Robo a interior de vehículos', 'incidencia_robo_interior_vehiculos', ['seguridad', 'delito', 'robo', 'vehiculo', 'tasa', 'interior']],
    ['tasa_robo_negocio', 'Tasa Robo a negocio', 'datos_delitos_robo_negocio_secretariado', ['seguridad', 'delito', 'robo', 'negocio', 'tasa', 'comercio']],
    ['tasa_robo_persona', 'Tasa Robo a persona', 'datos_delitos_robo_transeunte_via_publica_secretariado', ['seguridad', 'delito', 'robo', 'persona', 'tasa', 'asalto']],
    ['tasa_robo_vehiculo_particular', 'Tasa Robo a vehículos particulares', 'datos_delitos_robo_coche_cuatro_ruedas_secretariado', ['seguridad', 'delito', 'robo', 'vehiculo', 'tasa', 'auto']],
    ['tasa_robo_autopartes', 'Tasa Robo de autopartes', 'datos_delitos_robo_autopartes_secretariado', ['seguridad', 'delito', 'robo', 'autopartes', 'tasa', 'piezas']],
    ['tasa_robo_motocicleta', 'Tasa Robo de motocicletas', 'datos_delitos_robo_motocicleta_secretariado', ['seguridad', 'delito', 'robo', 'moto', 'tasa', 'motocicleta']],
    ['tasa_violencia_familiar', 'Tasa Violencia familiar', 'datos_delitos_violencia_familiar_secretariado', ['seguridad', 'delito', 'violencia', 'familia', 'tasa', 'domestica']],
    ['tasa_abuso_sexual_infantil', 'Tasa Abuso sexual infantil', 'datos_delitos_abuso_sexual_secretariado', ['seguridad', 'delito', 'abuso', 'sexual', 'tasa', 'infantil']],
    ['tasa_violacion', 'Tasa Violación', 'datos_delitos_violacion_secretariado', ['seguridad', 'delito', 'violacion', 'tasa', 'sexual']],
    ['tasa_feminicidio', 'Tasa Feminicidio', 'datos_delitos_feminicidio_secretariado', ['seguridad', 'delito', 'feminicidio', 'tasa', 'mujer']]
];

export const seguridadLayers = {
    id: 'seguridad',
    label: 'Seguridad',
    children: [
        {
            id: 'delitos-fuero-comun',
            label: 'Delitos del Fuero Común',
            base: 'inegi',
            children: [
                {
                    id: 'cat-vida-integridad',
                    label: 'Delitos contra la vida y la integridad corporal',
                    isCategory: true,
                    children: DELITOS_FUERO_COMUN.filter(d => ['homicidio_doloso', 'lesiones_dolosas', 'feminicidio'].includes(d[0]))
                        .map(([id, label, layerName, tags]) => ({
                            id,
                            label,
                            wmsConfig: createSeguridadLayer.withFilter('delitos', `delito = '${layerName}'`),
                            searchMeta: { tags }
                        }))
                },
                {
                    id: 'cat-patrimonio',
                    label: 'Delitos contra el patrimonio',
                    isCategory: true,
                    children: DELITOS_FUERO_COMUN.filter(d => [
                        'robo_a_casa_habitacion', 'robo_a_vehiculos_particulares', 'robo_de_autopartes',
                        'robo_a_vehiculos_de_carga_pesada', 'robo_a_persona', 'robo_a_bancos',
                        'robo_a_negocio', 'robo_a_cuentahabientes', 'robo_a_interior_de_vehiculos',
                        'robo_de_motocicletas'
                    ].includes(d[0]))
                        .map(([id, label, layerName, tags]) => ({
                            id,
                            label,
                            wmsConfig: createSeguridadLayer.withFilter('delitos', `delito = '${layerName}'`),
                            searchMeta: { tags }
                        }))
                },
                {
                    id: 'cat-familia',
                    label: 'Delitos contra la familia',
                    isCategory: true,
                    children: DELITOS_FUERO_COMUN.filter(d => ['violencia_familiar'].includes(d[0]))
                        .map(([id, label, layerName, tags]) => ({
                            id,
                            label,
                            wmsConfig: createSeguridadLayer.withFilter('delitos', `delito = '${layerName}'`),
                            searchMeta: { tags }
                        }))
                },
                {
                    id: 'cat-libertad-sexual',
                    label: 'Delitos contra la libertad y la seguridad sexual',
                    isCategory: true,
                    children: DELITOS_FUERO_COMUN.filter(d => ['abuso_sexual_infantil', 'violacion'].includes(d[0]))
                        .map(([id, label, layerName, tags]) => ({
                            id,
                            label,
                            wmsConfig: createSeguridadLayer.withFilter('delitos', `delito = '${layerName}'`),
                            searchMeta: { tags }
                        }))
                }
            ]
        },
        {
            id: 'Tasa_incidencia_delitos_del_fuero_comun',
            label: 'Tasa de incidencia delitos del fuero común',
            base: 'inegi',
            children: [
                {
                    id: 'cat-tasa-vida-integridad',
                    label: 'Delitos contra la vida y la integridad corporal (tasa)',
                    isCategory: true,
                    children: TASAS_DELITOS_FUERO_COMUN.filter(d => ['tasa_homicidio_doloso', 'tasa_lesiones_dolosas', 'tasa_feminicidio'].includes(d[0]))
                        .map(([id, label, layerName, tags]) => ({
                            id,
                            label,
                            wmsConfig: createSeguridadLayer(layerName),
                            searchMeta: { tags }
                        }))
                },
                {
                    id: 'cat-tasa-patrimonio',
                    label: 'Delitos contra el patrimonio (tasa)',
                    isCategory: true,
                    children: TASAS_DELITOS_FUERO_COMUN.filter(d => [
                        'tasa_robo_casa_habitacion', 'tasa_robo_vehiculo_particular', 'tasa_robo_autopartes',
                        'tasa_robo_vehiculo_carga_pesada', 'tasa_robo_persona', 'tasa_robo_bancos',
                        'tasa_robo_negocio', 'tasa_robo_cuentahabientes', 'tasa_robo_interior_vehiculos',
                        'tasa_robo_motocicleta'
                    ].includes(d[0]))
                        .map(([id, label, layerName, tags]) => ({
                            id,
                            label,
                            wmsConfig: createSeguridadLayer(layerName),
                            searchMeta: { tags }
                        }))
                },
                {
                    id: 'cat-tasa-familia',
                    label: 'Delitos contra la familia',
                    isCategory: true,
                    children: TASAS_DELITOS_FUERO_COMUN.filter(d => ['tasa_violencia_familiar'].includes(d[0]))
                        .map(([id, label, layerName, tags]) => ({
                            id,
                            label,
                            wmsConfig: createSeguridadLayer(layerName),
                            searchMeta: { tags }
                        }))
                },
                {
                    id: 'cat-tasa-libertad-sexual',
                    label: 'Delitos contra la libertad y la seguridad sexual',
                    isCategory: true,
                    children: TASAS_DELITOS_FUERO_COMUN.filter(d => ['tasa_abuso_sexual_infantil', 'tasa_violacion'].includes(d[0]))
                        .map(([id, label, layerName, tags]) => ({
                            id,
                            label,
                            wmsConfig: createSeguridadLayer(layerName),
                            searchMeta: { tags }
                        }))
                }
            ]
        },
        {
            id: 'personas-desaparecidas',
            label: 'Personas Desaparecidas',
            base: 'inegi',
            children: [
                {
                    id: 'tasa_personas_desaparecidas',
                    label: 'Personas desaparecidas',
                    wmsConfig: createSeguridadLayer('Tasa de personas desaparecidas'),
                    searchMeta: { hasMunicipio: false, hasDireccion: false, searchableFields: [], tags: ['seguridad', 'desaparecidos'] },
                    children: [
                        {
                            id: 'tasa_hombres_desaparecidos',
                            label: 'Hombres desaparecidos',
                            wmsConfig: createSeguridadLayer.withFilter('tasa_personas_desaparecidas', "delito = 'tasa_hombres_desaparecidos'"),
                            searchMeta: { hasMunicipio: false, hasDireccion: false, searchableFields: [], tags: ['seguridad', 'desaparecidos', 'hombres'] }
                        },
                        {
                            id: 'tasa_mujeres_desaparecidas',
                            label: 'Mujeres desaparecidas',
                            wmsConfig: createSeguridadLayer.withFilter('tasa_personas_desaparecidas', "delito = 'tasa_mujeres_desaparecidas'"),
                            searchMeta: { hasMunicipio: false, hasDireccion: false, searchableFields: [], tags: ['seguridad', 'desaparecidos', 'mujeres'] }
                        }
                    ]
                },
                {
                    id: 'tasa_personas_localizadas',
                    label: 'Personas localizadas',
                    wmsConfig: createSeguridadLayer('Tasa de personas localizadas'),
                    searchMeta: { hasMunicipio: false, hasDireccion: false, searchableFields: [], tags: ['seguridad', 'localizados'] },
                    children: [
                        {
                            id: 'tasa_hombres_localizados',
                            label: 'Hombres localizados',
                            wmsConfig: createSeguridadLayer.withFilter('tasa_personas_localizadas', "delito = 'tasa_hombres_localizados'"),
                            searchMeta: { hasMunicipio: false, hasDireccion: false, searchableFields: [], tags: ['seguridad', 'localizados', 'hombres'] }
                        },
                        {
                            id: 'tasa_mujeres_localizadas',
                            label: 'Mujeres localizadas',
                            wmsConfig: createSeguridadLayer.withFilter('tasa_personas_localizadas', "delito = 'tasa_mujeres_localizadas'"),
                            searchMeta: { hasMunicipio: false, hasDireccion: false, searchableFields: [], tags: ['seguridad', 'localizados', 'mujeres'] }
                        }
                    ]
                }
            ]
        }
    ]
};