import { createLayerFactory } from '../utils/layerFactory';
import { cardTemplates, createMunicipioConfig } from '../../../components/InfoBox/utils/cardTemplates';

const SALUD_LAYER = 'gold_unidades_salud_mapalab';

const createSaludLayer = createLayerFactory('salud');
const createDesarrolloSocialLayer = createLayerFactory('desarrollo');

const establecimientosSaludConfig = cardTemplates.TDEMECLU({
    title: 'nombre_unidad',
    municipio: 'municipio',
    caracteristica: ['nombre_institucion', 'nivel_atencion', 'estatus_operacion', 'nombre_tipo_establecimiento'],
    list: [
        { label: 'Año de la información', field: 'fecha' },
        { label: 'Teléfono', field: 'telefono_1' },
    ],
    ubicacion: 'domicilio'
});

const INSTITUCIONES_PRIMER_NIVEL = [
    ['centros_integracion_juvenil_1', 'Centros de Integración Juvenil', 'Centros de integración Juvenil', ['salud', 'primer_nivel', 'juvenil']],
    ['cruz_roja_1', 'Cruz Roja Mexicana', 'Cruz Roja Mexicana', ['salud', 'primer_nivel', 'cruz_roja']],
    ['imss_1', 'IMSS', 'Instituto Mexicano del Seguro Social', ['salud', 'primer_nivel', 'imss', 'seguro_social']],
    ['issste_1', 'ISSSTE', 'Instituto de Seguridad y Servicios Sociales de los Trabajadores del Estado', ['salud', 'primer_nivel', 'issste']],
    ['pemex_1', 'PEMEX', 'Petroleos Mexicanos', ['salud', 'primer_nivel', 'pemex']],
    ['sct_1', 'SCT', 'Secretaria de Comunicaciones y Transportes', ['salud', 'primer_nivel', 'sct']],
    ['secretaria_salud_1', 'Secretaría de Salud', 'Secretaria de Salud', ['salud', 'primer_nivel', 'ssa']],
    ['sedena_1', 'SEDENA', 'Secretaria de la Defensa Nacional', ['salud', 'primer_nivel', 'sedena']],
    ['servicios_medicos_estatales_1', 'Servicios Médicos Estatales', 'Servicios Medicos Estatales', ['salud', 'primer_nivel', 'estatal']],
    ['servicios_medicos_municipales_1', 'Servicios Médicos Municipales', 'Servicios Medicos Municipales', ['salud', 'primer_nivel', 'municipal']],
    ['privados_1', 'Privados', 'Servicios Medicos Privados', ['salud', 'primer_nivel', 'privado']],
    ['universitarios_1', 'Universitarios', 'Servicios Medicos Universitarios', ['salud', 'primer_nivel', 'universitario']],
    ['dif_1', 'DIF', 'Sistema Nacional para el Desarrollo Integral de la Familia', ['salud', 'primer_nivel', 'dif']],
];

const INSTITUCIONES_SEGUNDO_NIVEL = [
    ['centros_integracion_juvenil_2', 'Centros de Integración Juvenil', 'Centros de integración Juvenil', ['salud', 'segundo_nivel', 'juvenil']],
    ['cruz_roja_2', 'Cruz Roja Mexicana', 'Cruz Roja Mexicana', ['salud', 'segundo_nivel', 'cruz_roja']],
    ['imss_2', 'IMSS', 'Instituto Mexicano del Seguro Social', ['salud', 'segundo_nivel', 'imss']],
    ['issste_2', 'ISSSTE', 'Instituto de Seguridad y Servicios Sociales de los Trabajadores del Estado', ['salud', 'segundo_nivel', 'issste']],
    ['semar_2', 'SEMAR', 'Secretaria de Marina', ['salud', 'segundo_nivel', 'marina']],
    ['secretaria_salud_2', 'Secretaría de Salud', 'Secretaria de Salud', ['salud', 'segundo_nivel', 'ssa']],
    ['sedena_2', 'SEDENA', 'Secretaria de la Defensa Nacional', ['salud', 'segundo_nivel', 'sedena']],
    ['servicios_medicos_municipales_2', 'Servicios Médicos Municipales', 'Servicios Medicos Municipales', ['salud', 'segundo_nivel', 'municipal']],
    ['privados_2', 'Privados', 'Servicios Medicos Privados', ['salud', 'segundo_nivel', 'privado']],
];

const INSTITUCIONES_TERCER_NIVEL = [
    ['imss_3', 'IMSS', 'Instituto Mexicano del Seguro Social', ['salud', 'tercer_nivel', 'imss']],
    ['issste_3', 'ISSSTE', 'Instituto de Seguridad y Servicios Sociales de los Trabajadores del Estado', ['salud', 'tercer_nivel', 'issste']],
    ['secretaria_salud_3', 'Secretaría de Salud', 'Secretaria de Salud', ['salud', 'tercer_nivel', 'ssa']],
    ['sedena_3', 'SEDENA', 'Secretaria de la Defensa Nacional', ['salud', 'tercer_nivel', 'sedena']],
    ['privados_3', 'Privados', 'Servicios Medicos Privados', ['salud', 'tercer_nivel', 'privado']],
];

const INSTITUCIONES_OTROS_NIVEL = [
    ['imss_otros', 'IMSS', 'Instituto Mexicano del Seguro Social', ['salud', 'otros_niveles', 'imss']],
    ['issste_otros', 'ISSSTE', 'Instituto de Seguridad y Servicios Sociales de los Trabajadores del Estado', ['salud', 'otros_niveles', 'issste']],
    ['secretaria_salud_otros', 'Secretaría de Salud', 'Secretaria de Salud', ['salud', 'otros_niveles', 'ssa']],
    ['servicios_medicos_estatales_otros', 'Servicios Médicos Estatales', 'Servicios Medicos Estatales', ['salud', 'otros_niveles', 'estatal']],
    ['privados_otros', 'Privados', 'Servicios Medicos Privados', ['salud', 'otros_niveles', 'privado']],
    ['dif_otros', 'DIF', 'Sistema Nacional para el Desarrollo Integral de la Familia', ['salud', 'otros_niveles', 'dif']],
];

export const saludLayers = {
    id: 'salud',
    label: 'Salud',
    children: [{
        id: 'oferta_infraestructura',
        label: 'Oferta e infraestructura',
        isCategory: true,
        children: [{
            id: 'establecimientos_salud',
            label: 'Establecimientos de salud',
            forceGroup: true,
            children: [
                {
                    id: 'primer_nivel',
                    label: 'Primer nivel',
                    isLabel: true,
                    children: INSTITUCIONES_PRIMER_NIVEL.map(([id, label, layerName, tags]) => ({
                        id, label,
                        wmsConfig: createSaludLayer.withFilter(SALUD_LAYER, `nombre_institucion =  '${layerName}' AND nivel_atencion = 'Primer nivel'`),
                        littleCard: establecimientosSaludConfig,
                        searchMeta: { tags }
                    }))
                }, {
                    id: 'segundo_nivel',
                    label: 'Segundo nivel',
                    isLabel: true,
                    children: INSTITUCIONES_SEGUNDO_NIVEL.map(([id, label, layerName, tags]) => ({
                        id, label,
                        wmsConfig: createSaludLayer.withFilter(SALUD_LAYER, `nombre_institucion =  '${layerName}' AND nivel_atencion = 'Segundo nivel'`),
                        littleCard: establecimientosSaludConfig,
                        searchMeta: { tags }
                    }))
                }, {
                    id: 'tercer_nivel',
                    label: 'Tercer nivel',
                    isLabel: true,
                    children: INSTITUCIONES_TERCER_NIVEL.map(([id, label, layerName, tags]) => ({
                        id, label,
                        wmsConfig: createSaludLayer.withFilter(SALUD_LAYER, `nombre_institucion =  '${layerName}' AND nivel_atencion = 'Tercer nivel'`),
                        littleCard: establecimientosSaludConfig,
                        searchMeta: { tags }
                    }))
                }, {
                    id: 'otros_nivel',
                    label: 'Otros',
                    isLabel: true,
                    children: INSTITUCIONES_OTROS_NIVEL.map(([id, label, layerName, tags]) => ({
                        id, label,
                        wmsConfig: createSaludLayer.withFilter(SALUD_LAYER, `nombre_institucion =  '${layerName}' AND nivel_atencion = 'Otros'`),
                        littleCard: establecimientosSaludConfig,
                        searchMeta: { tags }
                    }))
                },
            ]
        },
        ]
    }, {
        id: 'acceso_servicios_salud',
        label: 'Acceso a servicios de salud',
        isCategory: true,
        children: [
            {
                id: 'carencia_acceso',
                label: 'Carencia por acceso a los servicios de salud (%)',
                wmsConfig: createDesarrolloSocialLayer('carencia_acceso_servicios_salud'),
                littleCard: createMunicipioConfig({
                    title: 'Personas con carencia por acceso a los servicios de salud (%)',
                    text: 'Porcentaje sobre la población total del municipio. Para la descripción de carencia por acceso a servicios de salud, ver la nota metodológica.',
                    stats: [
                        { label: 'Número de personas', field: 'personas' },
                        { label: 'Porcentaje', field: 'porcentaje' },
                        { label: 'Carencias promedio', field: 'carencias_promedio' },
                    ]
                }),
                searchMeta: { tags: ['salud', 'carencia', 'acceso', 'servicios', 'pobreza', 'vulnerabilidad', 'coneval'] }
            }
        ]
    }
    ]
};
