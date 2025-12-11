import { getSearchConfig, findAllMatches, getAllLayerIds } from './searchConfig';

const BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

const ENDPOINTS = {
    MUNICIPIOS: '/mapalab/layers/by-category/municipios',
    DIRECCIONES: '/mapalab/layers/by-category/direcciones',
    SEARCH: '/mapalab/layers/search',
    AUTOCOMPLETE: '/mapalab/layers/autocomplete'
};

export const fetchMunicipios = async (layerId, filters = {}) => {
    const config = getSearchConfig(layerId);

    if (!config || !config.hasMunicipio) {
        throw new Error(`La capa ${layerId} no tiene búsqueda por municipio habilitada`);
    }

    try {
        const url = new URL(`${BASE_URL}${ENDPOINTS.MUNICIPIOS}`);
        url.searchParams.set('layer', layerId);

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                url.searchParams.set(key, value);
            }
        });

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener municipios:', error);
        throw error;
    }
};

export const fetchDirecciones = async (layerId, filters = {}) => {
    const config = getSearchConfig(layerId);

    if (!config || !config.hasDireccion) {
        throw new Error(`La capa ${layerId} no tiene búsqueda por dirección habilitada`);
    }

    try {
        const url = new URL(`${BASE_URL}${ENDPOINTS.DIRECCIONES}`);
        url.searchParams.set('layer', layerId);

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                url.searchParams.set(key, value);
            }
        });

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener direcciones:', error);
        throw error;
    }
};

export const searchInLayer = async (layerId, query, filters = {}) => {
    const config = getSearchConfig(layerId);

    if (!config) {
        throw new Error(`La capa ${layerId} no está configurada para búsqueda`);
    }

    try {
        const url = new URL(`${BASE_URL}${ENDPOINTS.SEARCH}`);
        url.searchParams.set('layer', layerId);

        if (query) {
            url.searchParams.set('q', query);
        }

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                url.searchParams.set(key, value);
            }
        });

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en la búsqueda:', error);
        throw error;
    }
};

export const searchInMultipleLayers = async (layerIds, query, filters = {}) => {
    try {
        const results = await Promise.allSettled(
            layerIds.map(layerId => searchInLayer(layerId, query, filters))
        );

        const grouped = {};
        results.forEach((result, index) => {
            const layerId = layerIds[index];
            if (result.status === 'fulfilled') {
                grouped[layerId] = result.value;
            } else {
                console.error(`Error en búsqueda de ${layerId}:`, result.reason);
                grouped[layerId] = { error: result.reason.message, results: [] };
            }
        });

        return grouped;
    } catch (error) {
        console.error('Error en búsqueda múltiple:', error);
        throw error;
    }
};

export const fetchAutocomplete = async (layerId, field, query, filters = {}) => {
    const config = getSearchConfig(layerId);

    if (!config || !config.searchableFields.includes(field)) {
        throw new Error(`Campo ${field} no es buscable en ${layerId}`);
    }

    try {
        const url = new URL(`${BASE_URL}${ENDPOINTS.AUTOCOMPLETE}`);
        url.searchParams.set('layer', layerId);
        url.searchParams.set('field', field);
        url.searchParams.set('q', query);

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                url.searchParams.set(key, value);
            }
        });

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener sugerencias:', error);
        throw error;
    }
};

export const searchGlobal = async (query, options = {}) => {
    const {
        includeLayerNames = true,
        includeLayerData = false,
        layerIds = null,
        minScore = 10,
        filters = {}
    } = options;

    const results = {
        layerMatches: [],
        dataMatches: {},
        hasDataResults: false
    };

    if (includeLayerNames) {
        results.layerMatches = findAllMatches(query, minScore);
    }

    if (includeLayerData) {
        try {
            const searchableLayerIds = layerIds || getAllLayerIds().filter(id => {
                const config = getSearchConfig(id);
                return config && config.searchableFields && config.searchableFields.length > 0;
            });

            if (searchableLayerIds.length > 0) {
                const dataResults = await searchInMultipleLayers(searchableLayerIds, query, filters);
                results.dataMatches = dataResults;

                results.hasDataResults = Object.values(dataResults).some(result =>
                    result && !result.error && result.results && result.results.length > 0
                );
            }
        } catch (error) {
            console.error('Error en búsqueda de datos:', error);
            results.dataMatches = { error: error.message };
        }
    }

    return results;
};
