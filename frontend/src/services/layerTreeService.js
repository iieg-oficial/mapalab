const API_BASE = import.meta.env.VITE_BACKEND_API_HOST || '/api/';

const memoryCache = {
    tree: null,
    etag: null,
    initialOrder: null,
    inFlight: null,
};

const buildUrl = (path) => {
    const base = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`;
    return `${base}${path.startsWith('/') ? path.slice(1) : path}`;
};

export const fetchLayerTree = async ({ force = false } = {}) => {
    if (!force && memoryCache.tree && memoryCache.etag) {
        return { tree: memoryCache.tree, etag: memoryCache.etag, fromCache: true };
    }

    if (memoryCache.inFlight) {
        return memoryCache.inFlight;
    }

    const url = buildUrl('layers/tree');
    const headers = {};
    if (memoryCache.etag) {
        headers['If-None-Match'] = memoryCache.etag;
    }

    memoryCache.inFlight = (async () => {
        try {
            const res = await fetch(url, { headers, credentials: 'include' });

            if (res.status === 304 && memoryCache.tree) {
                return { tree: memoryCache.tree, etag: memoryCache.etag, fromCache: true };
            }

            if (!res.ok) {
                throw new Error(`GET /layers/tree fallo ${res.status}`);
            }

            const tree = await res.json();
            const etag = res.headers.get('etag') || res.headers.get('ETag');

            memoryCache.tree = tree;
            memoryCache.etag = etag;

            return { tree, etag, fromCache: false };
        } finally {
            memoryCache.inFlight = null;
        }
    })();

    return memoryCache.inFlight;
};

export const fetchInitialOrder = async () => {
    if (memoryCache.initialOrder) {
        return memoryCache.initialOrder;
    }
    const url = buildUrl('layers/initial-order');
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
        throw new Error(`GET /layers/initial-order fallo ${res.status}`);
    }
    const order = await res.json();
    memoryCache.initialOrder = order;
    return order;
};

export const searchLayersRemote = async (q, limit = 50) => {
    if (!q || !q.trim()) return [];
    const url = buildUrl(`layers/search?q=${encodeURIComponent(q)}&limit=${limit}`);
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
        throw new Error(`GET /layers/search fallo ${res.status}`);
    }
    return res.json();
};

export const clearLayerTreeCache = () => {
    memoryCache.tree = null;
    memoryCache.etag = null;
    memoryCache.initialOrder = null;
    memoryCache.inFlight = null;
};
