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

const POLL_INTERVAL_MS = 30000;
const VERSION_EVENT_EVENTOS = 'mapalab:eventos-changed';
const VERSION_EVENT_HOME = 'mapalab:home-changed';
let watcherTimer = null;
let lastVersions = { eventos: null, home: null };

const fetchVersions = async () => {
    const res = await fetch(buildUrl('cache-version'), { credentials: 'include' });
    if (!res.ok) throw new Error(`GET /cache-version fallo ${res.status}`);
    return res.json();
};

const checkVersions = async () => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    try {
        const versions = await fetchVersions();
        if (lastVersions.eventos === null && lastVersions.home === null) {
            lastVersions = versions;
            return;
        }
        if (versions.eventos !== lastVersions.eventos) {
            cache.eventos = null;
            cache.eventosInFlight = null;
            window.dispatchEvent(new CustomEvent(VERSION_EVENT_EVENTOS));
        }
        if (versions.home !== lastVersions.home) {
            cache.home = null;
            cache.homeInFlight = null;
            window.dispatchEvent(new CustomEvent(VERSION_EVENT_HOME));
        }
        lastVersions = versions;
    } catch { /* silencioso */ }
};

export const startMapalabCacheVersionWatcher = () => {
    if (watcherTimer || typeof window === 'undefined') return;
    checkVersions();
    watcherTimer = setInterval(checkVersions, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkVersions();
    });
};

export const onEventosChanged = (handler) => {
    window.addEventListener(VERSION_EVENT_EVENTOS, handler);
    return () => window.removeEventListener(VERSION_EVENT_EVENTOS, handler);
};

export const onHomeChanged = (handler) => {
    window.addEventListener(VERSION_EVENT_HOME, handler);
    return () => window.removeEventListener(VERSION_EVENT_HOME, handler);
};
