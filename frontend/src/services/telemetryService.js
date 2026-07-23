const FLUSH_INTERVAL_MS = 30_000;
const HEARTBEAT_INTERVAL_MS = 60_000;
const MAX_BATCH = 50;
const MAX_RETRIES = 3;
const SESSION_STORAGE_KEY = 'mapalab.telemetry.session';
const QUEUE_OVERFLOW_LIMIT = 500;

const DEFAULT_BASE = '/api/public/';
const apiBase = (import.meta.env.VITE_MARIACHI_PUBLIC_API_HOST || DEFAULT_BASE).replace(/\/+$/, '');
const endpoint = `${apiBase}/mapalab/events/batch`;

const isDev = import.meta.env.VITE_NODE_ENV === 'development';
const enabled = import.meta.env.VITE_TELEMETRY_ENABLED !== 'false';
const dnt = typeof navigator !== 'undefined' && (
    navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1'
);

const uuidv4 = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const readSession = () => {
    try {
        const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed && typeof parsed.id === 'string') {
            return parsed;
        }
    } catch {
        return null;
    }
    return null;
};

const writeSession = (data) => {
    try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch {
        /* sessionStorage no disponible */
    }
};

const detectSource = () => {
    if (typeof window === 'undefined') return 'visor';
    const path = window.location.pathname || '';
    if (path.endsWith('/embed') || path.includes('/embed/')) return 'embed';
    if (path.endsWith('/catalogo') || path.includes('/catalogo/')) return 'catalogo';
    return 'visor';
};

const state = {
    sessionId: null,
    source: 'visor',
    queue: [],
    started: false,
    flushTimer: null,
    heartbeatTimer: null,
    lastHeartbeatAt: null,
    failedAttempts: 0,
};

const ensureSession = () => {
    if (state.sessionId) return;
    const existing = readSession();
    const now = Date.now();
    const source = detectSource();
    if (existing && existing.expiresAt > now && existing.source === source) {
        state.sessionId = existing.id;
        state.source = source;
        return;
    }
    state.sessionId = uuidv4();
    state.source = source;
    writeSession({
        id: state.sessionId,
        source,
        startedAt: now,
        expiresAt: now + 1000 * 60 * 60 * 4,
    });
};

const sanitizeProps = (params = {}) => {
    if (!params || typeof params !== 'object') return {};
    const out = {};
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (typeof value === 'function') continue;
        out[key] = value;
    }
    return out;
};

const buildBatchBody = (events) => ({
    sessionId: state.sessionId,
    source: state.source,
    referrer: typeof document !== 'undefined' ? document.referrer || null : null,
    pathname: typeof window !== 'undefined' ? window.location.pathname || null : null,
    events,
});

const sendWithFetch = async (events) => {
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildBatchBody(events)),
            keepalive: events.length < 30,
        });
        if (!res.ok) throw new Error(`telemetry http ${res.status}`);
        state.failedAttempts = 0;
        return true;
    } catch (err) {
        state.failedAttempts += 1;
        if (isDev) console.warn('[telemetry] flush failed', err);
        return false;
    }
};

const sendWithBeacon = (events) => {
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) return false;
    try {
        const blob = new Blob([JSON.stringify(buildBatchBody(events))], { type: 'application/json' });
        return navigator.sendBeacon(endpoint, blob);
    } catch {
        return false;
    }
};

const flush = async (useBeacon = false) => {
    if (!state.queue.length) return;
    ensureSession();
    const events = state.queue.splice(0, MAX_BATCH);
    let ok;
    if (useBeacon) {
        ok = sendWithBeacon(events);
    } else {
        ok = await sendWithFetch(events);
    }
    if (!ok && !useBeacon && state.failedAttempts <= MAX_RETRIES) {
        state.queue.unshift(...events);
        return;
    }
    if (!ok && !useBeacon) {
        state.queue.length = 0;
        state.failedAttempts = 0;
    }
};

const ensureStarted = () => {
    if (!enabled || dnt || state.started || typeof window === 'undefined') return;
    state.started = true;
    ensureSession();
    state.flushTimer = window.setInterval(flush, FLUSH_INTERVAL_MS);
    state.heartbeatTimer = window.setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        const now = Date.now();
        const startedAt = (readSession() || {}).startedAt || now;
        enqueue('session_heartbeat', { durationSec: Math.round((now - startedAt) / 1000) });
    }, HEARTBEAT_INTERVAL_MS);
    window.addEventListener('pagehide', () => flush(true));
    window.addEventListener('beforeunload', () => flush(true));
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flush(true);
    });
    enqueue('session_start', { source: state.source });
};

export const enqueue = (eventName, params = {}) => {
    if (!enabled || dnt) return;
    if (!state.started) ensureStarted();
    if (state.queue.length >= QUEUE_OVERFLOW_LIMIT) return;
    const props = sanitizeProps(params);
    const layerId = props.layer_id || props.layerId || null;
    if (layerId) {
        delete props.layer_id;
        delete props.layerId;
    }
    state.queue.push({
        eventName,
        ts: new Date().toISOString(),
        layerId,
        props,
    });
    if (state.queue.length >= MAX_BATCH) {
        flush(false);
    }
};
