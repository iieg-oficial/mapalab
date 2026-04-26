const API_BASE = import.meta.env.VITE_MAPALAB_PUBLIC_API_HOST || '/api/mapalab/';

const buildUrl = (path) => {
    const base = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`;
    return `${base}${path.startsWith('/') ? path.slice(1) : path}`;
};

const cache = {
    eventos: null,
    home: null,
    eventosInFlight: null,
    homeInFlight: null,
};

export const fetchEventos = async () => {
    if (cache.eventos) return cache.eventos;
    if (cache.eventosInFlight) return cache.eventosInFlight;

    cache.eventosInFlight = (async () => {
        try {
            const res = await fetch(buildUrl('eventos'), { credentials: 'include' });
            if (!res.ok) throw new Error(`GET /eventos fallo ${res.status}`);
            const data = await res.json();
            cache.eventos = Array.isArray(data) ? data : [];
            return cache.eventos;
        } finally {
            cache.eventosInFlight = null;
        }
    })();

    return cache.eventosInFlight;
};

export const fetchHomeContent = async () => {
    if (cache.home) return cache.home;
    if (cache.homeInFlight) return cache.homeInFlight;

    cache.homeInFlight = (async () => {
        try {
            const res = await fetch(buildUrl('home'), { credentials: 'include' });
            if (!res.ok) throw new Error(`GET /home fallo ${res.status}`);
            cache.home = await res.json();
            return cache.home;
        } finally {
            cache.homeInFlight = null;
        }
    })();

    return cache.homeInFlight;
};

export const clearMapalabPublicCache = () => {
    cache.eventos = null;
    cache.home = null;
    cache.eventosInFlight = null;
    cache.homeInFlight = null;
};
