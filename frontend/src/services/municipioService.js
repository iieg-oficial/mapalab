import GeoJSON from 'ol/format/GeoJSON';

const API_HOST = (import.meta.env.VITE_BACKEND_API_HOST || '/api/').replace(/\/+$/, '');

export const MUNICIPIO_SOURCES = ['iieg', 'inegi'];

const normalizeSource = (sourceId) => (MUNICIPIO_SOURCES.includes(sourceId) ? sourceId : 'iieg');

const listCache = new Map();
const geomCache = new Map();

const geoJsonFormat = new GeoJSON({
    featureProjection: 'EPSG:3857',
    dataProjection: 'EPSG:3857',
});

export const fetchMunicipiosList = async ({ signal, force = false } = {}) => {
    if (!force && listCache.has('all')) {
        return listCache.get('all');
    }
    const res = await fetch(`${API_HOST}/municipios/`, { signal });
    if (!res.ok) {
        throw new Error(`Backend responde ${res.status} al listar municipios`);
    }
    const data = await res.json();
    const items = (data?.items || []).map(item => ({
        clave: String(item.clave),
        nombre: String(item.nombre),
        region: item.region || null,
    }));
    listCache.set('all', items);
    return items;
};

const EMPTY_RESULT = Object.freeze({ items: [], unionBbox: null });

export const fetchMunicipiosGeometries = async (sourceId = 'iieg', claves = [], { signal, force = false } = {}) => {
    if (!Array.isArray(claves) || claves.length === 0) return EMPTY_RESULT;
    const source = normalizeSource(sourceId);
    const sortedKey = [...claves].map(String).sort().join(',');
    const cacheKey = `${source}|${sortedKey}`;
    if (!force && geomCache.has(cacheKey)) {
        return geomCache.get(cacheKey);
    }
    const params = new URLSearchParams({
        source,
        claves: claves.map(String).join(','),
    });
    const res = await fetch(`${API_HOST}/municipios/geometries?${params.toString()}`, { signal });
    if (!res.ok) {
        throw new Error(`Backend responde ${res.status} al pedir geometrías`);
    }
    const data = await res.json();
    const features = geoJsonFormat.readFeatures(data);
    const items = features.map(feature => ({
        clave: String(feature.get('clave') ?? ''),
        nombre: feature.get('nombre'),
        geometry: feature.getGeometry(),
    })).filter(item => item.clave && item.geometry);
    const result = {
        items,
        unionBbox: Array.isArray(data?.unionBbox) && data.unionBbox.length === 4
            ? data.unionBbox.map(Number)
            : null,
    };
    geomCache.set(cacheKey, result);
    return result;
};

let siluetasCache = null;

export const fetchSiluetas = () => {
    if (siluetasCache) return siluetasCache;
    siluetasCache = fetch(`${API_HOST}/municipios/siluetas`)
        .then((res) => {
            if (!res.ok) throw new Error(`Backend responde ${res.status} al pedir las siluetas`);
            return res.json();
        })
        .then(data => ({
            estado: data?.estado ? geoJsonFormat.readGeometry(data.estado) : null,
            municipios: (data?.municipios || [])
                .filter(item => item?.geometry)
                .map(item => ({ clave: String(item.clave), nombre: String(item.nombre), geometry: geoJsonFormat.readGeometry(item.geometry) })),
        }))
        .catch((error) => {
            siluetasCache = null;
            throw error;
        });
    return siluetasCache;
};

export const clearMunicipioCache = () => {
    listCache.clear();
    geomCache.clear();
    siluetasCache = null;
};
