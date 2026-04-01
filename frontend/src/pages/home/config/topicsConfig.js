const topicsConfig = {
    topics: [
        {
            id: 'general',
            label: 'General',
            description: 'Navega el territorio de Jalisco a través de un mapa base que facilita la ubicación y comprensión geográfica.',
            icon: 'base_layers',
            subtopics: [
                { label: 'Medio físico', layerIds: ['cuerpos_de_agua_50k'] },
                { label: 'Centro e infraestructura', layerIds: ['cabeceras_municipales','limite_municipal'] }
            ]
        },{
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
                { label: 'Ocupación y empleo', layerIds: ['tasa_trabajadores_asegurados'] },
                { label: 'Sector primario', layerIds: ['agave'] }
            ]
        }, {
            id: 'recursos',
            label: 'Recursos y Calidad de Vida',
            description: 'Encuentra información sobre espacios públicos, agua, clima y áreas naturales protegidas.',
            icon: 'recursos',
            subtopics: [
                { label: 'Asentamientos urbanos', layerIds: ['espacios_publicos_y_lugares_recreativos'] },
                { label: 'Clima', layerIds: ['temperatura_media_anual'] },
                { label: 'Agua', layerIds: ['disponibilidad_acuiferos'] },
                { label: 'Áreas protegidas', layerIds: ['bosque_de_la_primavera'] },
                { label: 'Territorio', layerIds: ['urbano'] }
            ]
        }, {
            id: 'seguridad',
            label: 'Seguridad',
            description: 'Conoce índices de seguridad y datos sobre diferentes categorías de delitos.',
            icon: 'seguridad',
            subtopics: [
                { label: 'Incidencia en delitos del fuero común', layerIds: ['tasa_lesiones_dolosas', 'tasa_homicidio_doloso'] },
                { label: 'Delitos del fuero común', layerIds: ['lesiones_dolosas', 'homicidio_doloso'] },
                { label: 'Personas desaparecidas', layerIds: ['tasa_personas_desaparecidas'] }
            ]
        }, {
            id: 'salud',
            label: 'Salud',
            description: 'Visualiza información sobre clínicas, hospitales y servicios médicos municipales, estatales y federales.',
            icon: 'salud',
            subtopics: [
                { label: 'Oferta e infraestructura', layerIds: ['establecimientos_salud'] },
                { label: 'Acceso a servicios de salud', layerIds: ['carencia_acceso'] }
            ]
        }, {
            id: 'educacion',
            label: 'Educación',
            description: 'Accede a estadísticas sobre escuelas en todos sus niveles y rezago educativo.',
            icon: 'educacion',
            subtopics: [
                { label: 'Oferta e infraestructura', layerIds: ['cat-centros-educativos'] },
                { label: 'Capacidades y alfabetización', layerIds: ['tasa_rezago_educativo'] }
            ]
        }, {
            id: 'desarrollo',
            label: 'Desarrollo Social',
            description: 'Analiza información sobre pobreza, vulnerabilidad y desigualdad.',
            icon: 'desarrollo',
            subtopics: [
                { label: 'Pobreza y vulnerabilidades', layerIds: ['tasa_pobreza'] },
                { label: 'Igualdad de género', layerIds: ['tasa_brecha_salarial'] }
            ]
        }, {
            id: 'gobierno',
            label: 'Gobierno y Ciudadanía',
            description: 'Explora cómo se manejan los recursos municipales con estadísticas sobre ingresos y gastos.',
            icon: 'gobierno',
            subtopics: [
                { label: 'Finanzas municipales', layerIds: ['tasa_ingreso_per_capita'] }
            ]
        }
    ]
};

export default topicsConfig;
