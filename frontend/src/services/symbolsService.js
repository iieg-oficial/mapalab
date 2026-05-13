const API_BASE = import.meta.env.VITE_MAPALAB_PUBLIC_API_HOST || '/api/mapalab/';

const buildUrl = (path) => {
    const base = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`;
    return `${base}${path.startsWith('/') ? path.slice(1) : path}`;
};

const cache = {
    catalog: null,
    inFlight: null,
};

export const fetchSymbolCatalog = async () => {
    if (cache.catalog) return cache.catalog;
    if (cache.inFlight) return cache.inFlight;

    cache.inFlight = (async () => {
        try {
            const res = await fetch(buildUrl('symbols/catalog'), { credentials: 'omit' });
            if (!res.ok) throw new Error(`GET /symbols/catalog fallo ${res.status}`);
            const data = await res.json();
            cache.catalog = Array.isArray(data?.categories) ? data.categories : [];
            return cache.catalog;
        } finally {
            cache.inFlight = null;
        }
    })();

    return cache.inFlight;
};

export const invalidateSymbolCatalog = () => {
    cache.catalog = null;
    cache.inFlight = null;
};
