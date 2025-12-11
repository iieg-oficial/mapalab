const escuelasConfig = {
    headerField: 'nombre_escuela',
    labels: ['nivel_educativo', 'control'],
    labelGroups: [
        { fields: ['municipio', 'localidad'] }
    ],
    list: [
        { label: 'Turno', field: 'nombre_turno' },
        { label: 'Sector', field: 'sector' },
        { label: 'Año de la información', field: '' },
    ],
    iconText: { icon: 'location', field: 'domicilio' },
    cards: [
        { label: 'Total de personal', field: 'total_personal' },
        { label: 'Total de alumnos', field: 'total_alumnos' },
    ],
};

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

const recursosConfig = (headerField) => ({
    headerField: headerField,
    labelGroups: [
        { fields: ['condicion', 'tipo'] }
    ],
    list: [
        { label: 'Región Hidrológica', field: 'region_hidrologica' },
        { label: 'Situación', field: 'situacion_acuifero' },
        { label: 'Condición', field: 'condicion_acuifero' },
        { label: 'Suelo', field: 'descripcion' },
        { label: 'Dominancia del suelo en la selección', field: 'dominancia' },
        { label: 'Fecha de decreto', field: 'fecha_decreto' },
    ],
    cards: [
        { label: 'Recarga media anual', field: 'recarga_media_anual_hm3' },
        { label: 'Descarga natural comprometida', field: 'descarga_natural_comprometida_hm3' },
        { label: 'Volumen extracción total', field: 'volumen_extraccion_total_hm3' },
        { label: '%', field: '%' }
    ],
});

const aeropuertosConfig = {
    headerField: 'nombre',
    labels: ['ciudad'],
    labelGroups: [
        { fields: ['tipo'] }
    ],
    list: [
        { label: 'Año de la información', field: 'fecha_ultimo_movimiento' },
    ],
    iconText: { icon: 'location', field: 'domicilio' },
};

const primaveraConfig = (headerField) => ({
    headerField: headerField,
    labelGroups: [
        { fields: ['municipio'], splitValues: true }
    ],
    list: [
        { label: 'Nombre del predio', field: 'nombre' },
        { label: 'Estatus', field: 'estatus' },
        { label: 'Fecha de registro', field: 'fecha' },
        { label: 'Folio', field: 'folio' },
        { label: 'Decreto', field: 'decreto' },
        { label: 'Manejo', field: 'manejo' },
        { label: 'Fecha de decreto', field: 'primer_decreto' },
    ],
    cards: [
        { label: 'Área del decreto', field: 'area_km2' },
        { label: 'Superficie', field: 'superficie' },
    ],
});

const carreterasCaminosConfig = (headerField) => ({
    headerField: headerField,
    labelGroups: [
        { fields: ['administracion', 'transito', 'pavimento', 'tipo_material'] }
    ],
    list: [
        { label: 'Código', field: 'codigo' },
        { label: 'Origen', field: 'origen' },
        { label: 'Destino', field: 'destino' },
        { label: 'Fecha de la capa', field: 'fecha' },
    ],
    cards: [
        { label: 'Cantidad de carriles', field: 'carriles' },
    ],
});

const regionesConfig = {
    headerField: 'region',
    labelGroups: [
        { fields: ['municipio'] }
    ],
    cards: [
        { label: 'Área', field: 'area_km2' },
    ],
};

const seguridadConfig = () => ({
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
});

export const featureDisplayConfig = {
    preescolar: escuelasConfig,
    primaria: escuelasConfig,
    secundaria: escuelasConfig,
    bachillerato: escuelasConfig,
    licenciaturas: escuelasConfig,
    imss: establecimientosSaludConfig,
    imss_bienestar: establecimientosSaludConfig,
    issste: establecimientosSaludConfig,
    secretaria_salud_jalisco: establecimientosSaludConfig,
    servicios_medicos_estatales: establecimientosSaludConfig,
    servicios_medicos_municipales: establecimientosSaludConfig,
    servicios_medicos_privados: establecimientosSaludConfig,
    servicios_medicos_universitarios: establecimientosSaludConfig,
    dif: establecimientosSaludConfig,
    centros_integracion_juvenil: establecimientosSaludConfig,
    cruz_roja: establecimientosSaludConfig,
    pemex: establecimientosSaludConfig,
    sct: establecimientosSaludConfig,
    sedena: establecimientosSaludConfig,
    semar: establecimientosSaludConfig,
    sspc: establecimientosSaludConfig,
    disponibilidad_acuiferos_2023: recursosConfig('nombre_acuifero'),
    cuerpos_de_agua: recursosConfig('nombre'),
    cuerpos_de_agua_250k: recursosConfig('nombre'),
    dominancia_de_uso_de_suelo: recursosConfig('Uso de suelo'),
    aeropuertos: aeropuertosConfig,
    agave_primavera: primaveraConfig('Agave dentro del Área de Protección de Flora y Fauna La Primavera'),
    area_bosque_primavera: primaveraConfig('Área de Protección Bosque La Primavera'),
    parcelas_primavera: primaveraConfig('Parcelas dentro del Área de Protección de Flora y Fauna La Primavera'),
    carretera_2012: carreterasCaminosConfig('Carreteras'),
    caminos_2012: carreterasCaminosConfig('Caminos'),
    regiones: regionesConfig,
    robo_a_bancos: seguridadConfig(),
    robo_a_casa_habitacion: seguridadConfig(),
    robo_a_vehiculos_de_carga_pesada: seguridadConfig(),
    robo_a_cuentahabientes: seguridadConfig(),
    robo_a_interior_de_vehiculos: seguridadConfig(),
    robo_a_negocio: seguridadConfig(),
    robo_a_persona: seguridadConfig(),
    robo_a_vehiculos_particulares: seguridadConfig(),
    robo_de_autopartes: seguridadConfig(),
    robo_de_motocicletas: seguridadConfig(),
    violencia_familiar: seguridadConfig(),
    abuso_sexual_infantil: seguridadConfig(),
    violacion: seguridadConfig(),
    feminicidio: seguridadConfig(),
    tasa_homicidio_doloso: seguridadConfig(),
    tasa_lesiones_dolosas: seguridadConfig(),
    tasa_robo_bancos: seguridadConfig(),
    tasa_robo_casa_habitacion: seguridadConfig(),
    tasa_robo_vehiculo_carga_pesada: seguridadConfig(),
    tasa_robo_cuentahabientes: seguridadConfig(),
    tasa_robo_interior_vehiculos: seguridadConfig(),
    tasa_robo_negocio: seguridadConfig(),
    tasa_robo_persona: seguridadConfig(),
    tasa_robo_vehiculo_particular: seguridadConfig(),
    tasa_robo_autopartes: seguridadConfig(),
    tasa_robo_motocicleta: seguridadConfig(),
    tasa_violencia_familiar: seguridadConfig(),
    tasa_abuso_sexual_infantil: seguridadConfig(),
    tasa_violacion: seguridadConfig(),
    tasa_feminicidio: seguridadConfig(),
    tasa_personas_desaparecidas: seguridadConfig(),
    tasa_personas_localizadas: seguridadConfig(),
};

export const getFeatureConfig = (layerId) => {
    return featureDisplayConfig[layerId] || null;
};
