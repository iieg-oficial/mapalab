const API_HOST = import.meta.env.VITE_BACKEND_API_HOST?.replace(/\/+$/, '');
const LAYERS_ENDPOINT = `${API_HOST}/mapalab/layers`;

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

const parseStatistics = (metadato) => {
    if (!metadato) return [];
    try {
        const parsed = typeof metadato === 'string' ? JSON.parse(metadato) : metadato;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const getThemeId = (themeName) => {
    if (!themeName) return 'general';
    const normalized = themeName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const themeMap = {
        'demografia': 'demografia',
        'salud': 'salud',
        'economia': 'economia',
        'educacion': 'educacion',
        'seguridad': 'seguridad',
        'gobierno': 'gobierno',
        'recursos': 'recursos',
        'desarrollo': 'desarrollo',
        'medio ambiente': 'recursos',
        'infraestructura': 'desarrollo'
    };
    return Object.keys(themeMap).find(key => normalized.includes(key)) || 'general';
};

const transformLayerResponse = (layer) => {
    const themeId = getThemeId(layer.tema);

    return {
        id: layer.nombre_capa_db,
        name: layer.nombre_capa_usuario || layer.nombre_capa_db,
        description: layer.descripcion,
        theme: {
            id: themeId,
            name: layer.tema || 'General',
            icon: THEME_ICONS[themeId] || THEME_ICONS['general'],
            color: THEME_COLORS[themeId] || THEME_COLORS['general']
        },
        updateInfo: layer.frecuencia_actualizacion || layer.fecha_ultima_actualizacion ? {
            frequency: layer.frecuencia_actualizacion,
            lastUpdate: layer.fecha_ultima_actualizacion
        } : null,
        statistics: parseStatistics(layer.metadato),
        methodology: layer.metodologia_texto ? {
            title: 'Metodología',
            content: layer.metodologia_texto,
            link: layer.metodologia_archivo_enlace
        } : null,
        temporalCoverage: layer.rangos_periodicidad ? {
            range: layer.rangos_periodicidad
        } : null,
        source: layer.fuentes_texto,
        sourceLink: layer.fuentes_enlace,
        license: 'Datos abiertos'
    };
};

export const getLayerMetadata = async (layerId) => {
    if (!API_HOST) {
        console.error('VITE_BACKEND_API_HOST no está configurado');
        return null;
    }

    const url = new URL(LAYERS_ENDPOINT);
    url.searchParams.set('keyword', layerId);
    url.searchParams.set('size', '1');

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        const layer = result.data?.find(l => l.nombre_capa_db === layerId);

        if (!layer) {
            return null;
        }

        return transformLayerResponse(layer);
    } catch (error) {
        console.error('Error al obtener metadata de la capa:', error);
        throw error;
    }
};

export const getLayerMetadataById = async (id) => {
    if (!API_HOST) {
        console.error('VITE_BACKEND_API_HOST no está configurado');
        return null;
    }

    const url = `${API_HOST}/mapalab/metadatos/${id}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const layer = await response.json();
        return transformLayerResponse(layer);
    } catch (error) {
        console.error('Error al obtener metadata por ID:', error);
        throw error;
    }
};
