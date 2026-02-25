const topicsConfig = {
    topics: [
        {
            id: 'demografia',
            label: 'Demografía',
            description: 'Consulta datos sobre cuántos somos y cómo nos distribuimos en Jalisco.',
            icon: 'demografia',
            subtopics: [
                { label: 'Población', layerIds: ['tasa_poblacion_total'] }
            ]
        }, {
            id: 'economia',
            label: 'Economía',
            description: 'Descubre cómo se mueve la economía con estadísticas de empleo, producción y actividad económica.',
            icon: 'economia',
            subtopics: [
                { label: 'Ocupación y empleo formal', layerIds: ['tasa_de_desempleo'] },
                { label: 'Cultivos', layerIds: ['agave', 'maiz', 'caña_de_azucar'] }
            ]
        }, {
            id: 'recursos',
            label: 'Recursos y Calidad de Vida',
            description: 'Encuentra información sobre espacios públicos, agua, clima y áreas naturales protegidas.',
            icon: 'recursos',
            subtopics: [
                { label: 'Espacios públicos', layerIds: ['espacios_publicos_y_lugares_recreativos'] },
                { label: 'Áreas naturales protegidas', layerIds: ['area_bosque_primavera'] }
            ]
        }, {
            id: 'seguridad',
            label: 'Seguridad',
            description: 'Conoce índices de seguridad y datos sobre diferentes categorías de delitos.',
            icon: 'seguridad',
            subtopics: [
                { label: 'Feminicidios', layerIds: ['tasa_feminicidio', 'feminicidio'] },
                { label: 'Personas desaparecidas', layerIds: ['tasa_personas_desaparecidas'] }
            ]
        }, {
            id: 'salud',
            label: 'Salud',
            description: 'Visualiza información sobre clínicas, hospitales y servicios médicos municipales, estatales y federales.',
            icon: 'salud',
            subtopics: [
                { label: 'Establecimientos de salud', layerIds: ['establecimientos_salud'] }
            ]
        }, {
            id: 'educacion',
            label: 'Educación',
            description: 'Accede a estadísticas sobre escuelas en todos sus niveles y rezago educativo.',
            icon: 'educacion',
            subtopics: [
                { label: 'Infraestructura en Educación', layerIds: ['escuelas'] }
            ]
        }, {
            id: 'desarrollo',
            label: 'Desarrollo Social',
            description: 'Analiza información sobre pobreza, vulnerabilidad y desigualdad.',
            icon: 'desarrollo',
            subtopics: [
                { label: 'Pobreza', layerIds: ['pobreza'] },
                { label: 'Igualdad de género', layerIds: ['ind_igualdad_genero'] }
            ]
        }, {
            id: 'gobierno',
            label: 'Gobierno y Ciudadanía',
            description: 'Explora cómo se manejan los recursos municipales con estadísticas sobre ingresos y gastos.',
            icon: 'gobierno',
            subtopics: [
                { label: 'Finanzas municipales', layerIds: ['ingresos_propios'] }
            ]
        }
    ]
};

export default topicsConfig;
