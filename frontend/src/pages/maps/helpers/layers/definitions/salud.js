import { createLayerFactory } from '../utils/layerFactory';

const SALUD_LAYER = 'establecimientos_de_salud_2025';

const createSaludLayer = createLayerFactory('salud');

const INSTITUCIONES = [
    ['imss', 'IMSS', 'Instituto Mexicano Del Seguro Social', ['salud', 'hospital', 'clinica', 'seguro', 'social', 'medico', 'atencion', 'publico']],
    ['imss_bienestar', 'IMSS Bienestar', 'Instituto Mexicano Del Seguro Social Regimen Bienestar', ['salud', 'hospital', 'clinica', 'seguro', 'social', 'bienestar', 'medico', 'atencion', 'publico']],
    ['issste', 'ISSSTE', 'Instituto De Seguridad Y Servicios Sociales De Los Trabajadores Del Estado', ['salud', 'hospital', 'clinica', 'seguro', 'trabajadores', 'estado', 'medico', 'atencion', 'publico']],
    ['secretaria_salud_jalisco', 'Secretaría de Salud Jalisco', 'Secretaria De Salud', ['salud', 'hospital', 'clinica', 'ssa', 'publico', 'medico', 'atencion', 'estatal']],
    ['servicios_medicos_estatales', 'Servicios Médicos Estatales', 'Servicios Medicos Estatales', ['salud', 'hospital', 'clinica', 'estatal', 'civil', 'medico', 'atencion', 'publico']],
    ['servicios_medicos_municipales', 'Servicios Médicos Municipales', 'Servicios Medicos Municipales', ['salud', 'hospital', 'clinica', 'municipal', 'cruz', 'verde', 'medico', 'atencion', 'publico']],
    ['servicios_medicos_privados', 'Servicios Médicos Privados', 'Servicios Medicos Privados', ['salud', 'hospital', 'clinica', 'privado', 'particular', 'medico', 'atencion', 'consultorio']],
    ['servicios_medicos_universitarios', 'Servicios Médicos Universitarios', 'Servicios Medicos Universitarios', ['salud', 'hospital', 'clinica', 'universidad', 'universitario', 'medico', 'atencion', 'udg']],
    ['dif', 'DIF', 'Sistema Nacional Para El Desarrollo Integral De La Familia', ['salud', 'asistencia', 'social', 'familia', 'desarrollo', 'integral', 'apoyo']],
    ['centros_integracion_juvenil', 'Centros de Integración Juvenil', 'Centros De Integracion Juvenil', ['salud', 'drogas', 'adicciones', 'juvenil', 'cij', 'rehabilitacion', 'prevencion']],
    ['cruz_roja', 'Cruz Roja Mexicana', 'Cruz Roja Mexicana', ['salud', 'emergencia', 'ambulancia', 'urgencias', 'socorro', 'ayuda']],
    ['pemex', 'Petróleos Mexicanos', 'Petroleos Mexicanos', ['salud', 'petroleos', 'petroleo', 'hospital', 'clinica', 'trabajadores']],
    ['sct', 'Secretaria de Comunicaciones y Transportes', 'Secretaria De Comunicaciones Y Transportes', ['salud', 'comunicaciones', 'transportes', 'medicina', 'preventiva']],
    ['sedena', 'Secretaría de la Defensa Nacional', 'Secretaria De La Defensa Nacional', ['salud', 'militar', 'ejercito', 'defensa', 'hospital', 'clinica']],
    ['semar', 'Secretaría de la Marina', 'Secretaria De Marina', ['salud', 'marina', 'naval', 'armada', 'hospital', 'clinica']],
    ['sspc', 'Secretaría de Seguridad y Protección Ciudadana', 'Secretaría De Seguridad Y Protección Ciudadana', ['salud', 'seguridad', 'proteccion', 'ciudadana', 'prevencion']]
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
