const BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

const MOCK_METADATA = {
    'delitos-fuero-comun': {
        id: 'delitos-fuero-comun',
        name: 'Delitos del Fuero Común',
        description: 'Esta capa integra información georreferenciada sobre la incidencia de delitos del fuero común registrados en el estado de Jalisco. Los delitos del fuero común son aquellos que afectan directamente a los ciudadanos y la comunidad local, siendo procesados por las autoridades estatales y municipales. La información incluye diversos tipos de delitos como robo en sus distintas modalidades (a casa habitación, vehículos, negocio, transeúnte), violencia familiar, delitos sexuales, homicidios y otros ilícitos que atentan contra la seguridad ciudadana. Los datos provienen del Sistema Nacional de Seguridad Pública y son compilados por el Secretariado Ejecutivo del Sistema Nacional de Seguridad Pública (SESNSP), en colaboración con las fiscalías estatales y las procuradurías de justicia. Esta información resulta fundamental para el diseño e implementación de estrategias de prevención del delito, la asignación eficiente de recursos policiales, la identificación de zonas de alta incidencia delictiva que requieren atención prioritaria, y la evaluación del impacto de las políticas públicas en materia de seguridad. Los datos son actualizados mensualmente y permiten realizar análisis de tendencias temporales, identificar patrones espaciales de criminalidad y apoyar la toma de decisiones en estrategias de seguridad pública.',
        theme: {
            id: 'seguridad',
            name: 'Seguridad',
            icon: '🚨',
            color: '#8b5cf6'
        },
        updateInfo: {
            frequency: 'Mensual',
            lastUpdate: '2024-11-30'
        },
        statistics: [
            { label: 'Total de delitos registrados', value: '45,678', unit: 'casos', icon: '📊' },
            { label: 'Tasa por cada 100 mil hab', value: '542.3', unit: 'delitos', icon: '📈' },
            { label: 'Variación anual', value: '-8.5%', unit: 'respecto al año anterior', icon: '📉' },
            { label: 'Municipios con registro', value: '125', icon: '📍' }
        ],
        methodology: {
            title: 'Metodología',
            content: 'Los datos de incidencia delictiva provienen de los registros administrativos generados por las carpetas de investigación iniciadas por las Fiscalías Generales de Justicia de las entidades federativas, las cuales son reportadas mensualmente al Secretariado Ejecutivo del Sistema Nacional de Seguridad Pública (SESNSP). La metodología de clasificación delictiva se basa en el Código Penal Federal y los códigos penales estatales, utilizando una tipología estandarizada que permite la comparabilidad entre entidades federativas. Cada delito es clasificado según su naturaleza, modalidad y bien jurídico afectado. Los datos son georreferenciados a nivel de colonia o localidad cuando la información está disponible, protegiendo la identidad de las víctimas conforme a la normatividad en materia de protección de datos personales. El proceso de validación incluye la verificación de consistencia temporal, la depuración de registros duplicados y el análisis de valores atípicos. Las tasas delictivas se calculan utilizando las proyecciones de población de CONAPO, expresándose por cada 100,000 habitantes para facilitar las comparaciones entre municipios de distinto tamaño poblacional. Es importante señalar que los datos representan delitos denunciados y registrados formalmente, existiendo un factor de cifra negra (delitos no denunciados) que no se refleja en estas estadísticas oficiales.'
        },
        temporalCoverage: {
            start: '2015',
            end: '2024'
        },
        source: 'Secretariado Ejecutivo del Sistema Nacional de Seguridad Pública (SESNSP) - Fiscalía General del Estado de Jalisco',
        license: 'Datos abiertos - Uso libre con atribución'
    },
    'establecimientos_salud': {
        id: 'establecimientos_salud',
        name: 'Establecimientos de salud',
        description: 'Esta capa representa la ubicación geográfica de los establecimientos de salud, tanto públicos como privados, que brindan servicios médicos en el estado de Jalisco. La información incluye hospitales, clínicas, centros de salud, consultorios médicos y unidades de atención primaria pertenecientes a diversas instituciones del sector salud, entre las que se encuentran la Secretaría de Salud Jalisco, el Instituto Mexicano del Seguro Social (IMSS), el Instituto de Seguridad y Servicios Sociales de los Trabajadores del Estado (ISSSTE), servicios médicos municipales, universitarios y del sector privado. Los datos incluyen información sobre el tipo de establecimiento, nivel de atención, servicios disponibles y capacidad instalada. Esta información es esencial para el análisis de accesibilidad geográfica a servicios de salud, la identificación de brechas en la cobertura sanitaria, la planeación de infraestructura médica, la optimización de rutas de traslado de pacientes en situaciones de emergencia y la evaluación de la distribución territorial de recursos sanitarios. Los establecimientos son clasificados según su nivel de atención (primaria, secundaria, terciaria), permitiendo identificar áreas con deficiencias en infraestructura médica especializada y apoyando la toma de decisiones en políticas públicas de salud orientadas a garantizar el acceso universal y equitativo a servicios médicos de calidad.',
        theme: {
            id: 'salud',
            name: 'Salud',
            icon: '🏥',
            color: '#ef4444'
        },
        updateInfo: {
            frequency: 'Semestral',
            lastUpdate: '2024-10-15'
        },
        statistics: [
            { label: 'Total de establecimientos', value: '3,245', unit: 'unidades', icon: '🏥' },
            { label: 'Establecimientos públicos', value: '1,892', unit: 'unidades', icon: '🏛️' },
            { label: 'Establecimientos privados', value: '1,353', unit: 'unidades', icon: '🏢' },
            { label: 'Cobertura municipal', value: '125', unit: 'municipios', icon: '📍' }
        ],
        methodology: {
            title: 'Metodología',
            content: 'La base de datos de establecimientos de salud se construye mediante la integración de múltiples fuentes oficiales, incluyendo el Catálogo de Claves de Entidades de Atención (CLUES) de la Secretaría de Salud Federal, los directorios de unidades médicas del IMSS e ISSSTE, registros de la Comisión Federal para la Protección contra Riesgos Sanitarios (COFEPRIS), y padrones de establecimientos privados con licencia sanitaria vigente. Cada establecimiento es validado y georreferenciado mediante técnicas de geocodificación que utilizan direcciones oficiales, complementadas con verificación mediante imágenes satelitales y, cuando es posible, visitas de campo. La información es clasificada según el tipo de establecimiento (hospital, clínica, centro de salud, consultorio), nivel de atención médica (primaria, secundaria, terciaria), tipo de institución (pública federal, estatal, municipal, privada, universitaria), y servicios disponibles (urgencias, hospitalización, cirugía, especialidades). Se realiza una actualización periódica que incluye la verificación del estatus operativo de cada establecimiento, la incorporación de nuevas unidades médicas y la baja de aquellas que han cesado operaciones. Para los análisis de accesibilidad geográfica, se calculan indicadores como tiempo de traslado, distancia a la unidad médica más cercana y población en áreas de influencia, utilizando herramientas de análisis de redes y sistemas de información geográfica.'
        },
        temporalCoverage: {
            start: '2020',
            end: '2024'
        },
        source: 'Secretaría de Salud Jalisco - CLUES (Catálogo de Claves de Entidades de Atención) - COFEPRIS',
        license: 'Datos abiertos - Uso libre con atribución'
    }
};

export const getLayerMetadata = async (layerId) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const metadata = MOCK_METADATA[layerId];
    if (!metadata) {
        return {
            id: layerId,
            name: layerId,
            description: 'Información detallada de la capa en desarrollo.',
            theme: {
                id: 'general',
                name: 'General',
                icon: '📊',
                color: '#64748b'
            },
            updateInfo: {
                frequency: 'Variable',
                lastUpdate: new Date().toISOString().split('T')[0]
            },
            statistics: [],
            methodology: null,
            temporalCoverage: null,
            source: 'IIEG Jalisco',
            license: 'Datos abiertos'
        };
    }

    return metadata;
};

export const THEME_ICONS = {
    'demografia': '👥',
    'salud': '🏥',
    'economia': '💼',
    'educacion': '🎓',
    'seguridad': '🚨',
    'gobierno': '🏛️',
    'recursos': '🌳',
    'desarrollo': '🏗️',
    'general': '📊'
};

export const THEME_COLORS = {
    'demografia': '#3b82f6',
    'salud': '#ef4444',
    'economia': '#10b981',
    'educacion': '#f59e0b',
    'seguridad': '#8b5cf6',
    'gobierno': '#ec4899',
    'recursos': '#14b8a6',
    'desarrollo': '#f97316',
    'general': '#64748b'
};
