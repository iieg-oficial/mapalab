import { createLayerFactory } from '../utils/layerFactory';

const SALUD_LAYER = 'gold_unidades_salud_mapalab';

const createSaludLayer = createLayerFactory('salud');

const establecimientosSaludConfig = {
    headerField: 'nombre_unidad',
    labels: ['municipio'],
    labelGroups: [
        { fields: ['nombre_institucion', 'clave_institucion', 'nivel_atencion'] }
    ],
    list: [
        { label: 'Año de la información', field: 'fecha_ultimo_movimiento' },
    ],
    iconText: { icon: 'location', field: 'observaciones_direccion' },
    cards: [
        { label: 'Total de camas', field: 'total_camas' },
        { label: 'Total de consultorios', field: 'total_consultorios' },
    ],
    cardsColumns: 2
};

const INSTITUCIONES = [
    ['imss', 'IMSS', 'Instituto Mexicano del Seguro Social', ['salud', 'hospital', 'clinica', 'seguro', 'social', 'medico', 'atencion', 'publico']],
    ['imss_bienestar', '*IMSS Bienestar', 'Instituto Mexicano del Seguro Social Regimen Bienestar', ['salud', 'hospital', 'clinica', 'seguro', 'social', 'bienestar', 'medico', 'atencion', 'publico']],
    ['issste', 'ISSSTE', 'Instituto de Seguridad y Servicios Sociales de los Trabajadores del Estado', ['salud', 'hospital', 'clinica', 'seguro', 'trabajadores', 'estado', 'medico', 'atencion', 'publico']],
    ['secretaria_salud_jalisco', 'Secretaría de Salud Jalisco', 'Secretaria de Salud', ['salud', 'hospital', 'clinica', 'ssa', 'publico', 'medico', 'atencion', 'estatal']],
    ['servicios_medicos_estatales', 'Servicios Médicos Estatales', 'Servicios Medicos Estatales', ['salud', 'hospital', 'clinica', 'estatal', 'civil', 'medico', 'atencion', 'publico']],
    ['servicios_medicos_municipales', 'Servicios Médicos Municipales', 'Servicios Medicos Municipales', ['salud', 'hospital', 'clinica', 'municipal', 'cruz', 'verde', 'medico', 'atencion', 'publico']],
    ['servicios_medicos_privados', 'Servicios Médicos Privados', 'Servicios Medicos Privados', ['salud', 'hospital', 'clinica', 'privado', 'particular', 'medico', 'atencion', 'consultorio']],
    ['servicios_medicos_universitarios', 'Servicios Médicos Universitarios', 'Servicios Medicos Universitarios', ['salud', 'hospital', 'clinica', 'universidad', 'universitario', 'medico', 'atencion', 'udg']],
    ['dif', 'DIF', 'Sistema Nacional para el Desarrollo Integral de la Familia', ['salud', 'asistencia', 'social', 'familia', 'desarrollo', 'integral', 'apoyo']],
    ['centros_integracion_juvenil', 'Centros de Integración Juvenil', 'Centros de integración Juvenil', ['salud', 'drogas', 'adicciones', 'juvenil', 'cij', 'rehabilitacion', 'prevencion']],
    ['cruz_roja', 'Cruz Roja Mexicana', 'Cruz Roja Mexicana', ['salud', 'emergencia', 'ambulancia', 'urgencias', 'socorro', 'ayuda']],
    ['pemex', 'Petróleos Mexicanos', 'Petroleos Mexicanos', ['salud', 'petroleos', 'petroleo', 'hospital', 'clinica', 'trabajadores']],
    ['sct', 'Secretaria de Comunicaciones y Transportes', 'Secretaria de Comunicaciones y Transportes', ['salud', 'comunicaciones', 'transportes', 'medicina', 'preventiva']],
    ['sedena', 'Secretaría de la Defensa Nacional', 'Secretaria de la Defensa Nacional', ['salud', 'militar', 'ejercito', 'defensa', 'hospital', 'clinica']],
    ['semar', 'Secretaría de la Marina', 'Secretaria de Marina', ['salud', 'marina', 'naval', 'armada', 'hospital', 'clinica']],
    ['sspc', '*Secretaría de Seguridad y Protección Ciudadana', 'Secretaría De Seguridad Y Protección Ciudadana', ['salud', 'seguridad', 'proteccion', 'ciudadana', 'prevencion']]
];

const COBERTURA = [
    ['estimacion_derechohabiencia', '*Estimación de derechohabiencia', 'estimacion_derechohabiencia', ['salud', 'derechohabiencia', 'afiliacion', 'seguro', 'cobertura', 'poblacion', 'acceso']],
    ['acceso_servicios_salud', '*% de población con carencia por acceso a servicios de salud', 'acceso_servicios_salud', ['salud', 'carencia', 'acceso', 'servicios', 'pobreza', 'vulnerabilidad', 'coneval']]
];

export const saludLayers = {
    id: 'salud',
    label: 'Salud',
    children: [
        {
            id: 'establecimientos_salud',
            label: 'Establecimientos de salud',
            base: 'iieg',
            children: INSTITUCIONES.map(([id, label, layerName, tags]) => ({
                id,
                label,
                wmsConfig: createSaludLayer.withFilter(SALUD_LAYER, `nombre_institucion =  '${layerName}'`),
                littleCard: establecimientosSaludConfig,
                searchMeta: {
                    hasMunicipio: true,
                    hasDireccion: false,
                    searchableFields: [],
                    tags
                }
            }))
        }, {
            id: 'cobertura_servicios_salud',
            label: 'Cobertura de servicios de salud',
            children: COBERTURA.map(([id, label, layerName, tags]) => ({
                id,
                label,
                base: 'iieg',
                wmsConfig: createSaludLayer(layerName),
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
