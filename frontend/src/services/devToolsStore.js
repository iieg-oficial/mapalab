import { PANTALLAS } from '@constants/pantallas';

const PREVIEW_KEY = 'devtools-preview-prod';
const ANALYTICS_KEY = 'devtools-analytics-panel';
const PANTALLA_KEY = 'devtools-pantalla';

const APP_ENV = import.meta.env.VITE_APP_ENV;
const BUILD_IS_NON_PROD = ['dev', 'beta'].includes(APP_ENV);
const TOGGLE_AVAILABLE = APP_ENV === 'dev';

const detectarMarco = () => {
    try {
        return window.self !== window.top;
    } catch {
        return true;
    }
};

const EN_MARCO = detectarMarco();

const listeners = new Set();

const readFlag = (key) => {
    if (!TOGGLE_AVAILABLE) return false;
    try {
        return sessionStorage.getItem(key) === 'true';
    } catch {
        return false;
    }
};

const leerPantalla = () => {
    if (!TOGGLE_AVAILABLE) return null;
    try {
        const valor = sessionStorage.getItem(PANTALLA_KEY);
        return PANTALLAS[valor] ? valor : null;
    } catch {
        return null;
    }
};

const persistirPantalla = (valor) => {
    try {
        if (valor) sessionStorage.setItem(PANTALLA_KEY, valor);
        else sessionStorage.removeItem(PANTALLA_KEY);
    } catch {
        return;
    }
};

const persist = (key, value) => {
    try {
        if (value) sessionStorage.setItem(key, 'true');
        else sessionStorage.removeItem(key);
    } catch {
        return;
    }
};

let previewingProd = readFlag(PREVIEW_KEY);
let analyticsPanelOpen = readFlag(ANALYTICS_KEY);
let pantalla = leerPantalla();

const emitChange = () => {
    listeners.forEach(fn => fn());
};

const sincronizarDesdeOtraVentana = (evento) => {
    if (![PREVIEW_KEY, ANALYTICS_KEY].includes(evento.key)) return;
    previewingProd = readFlag(PREVIEW_KEY);
    analyticsPanelOpen = readFlag(ANALYTICS_KEY);
    emitChange();
};

if (TOGGLE_AVAILABLE && typeof window !== 'undefined') {
    window.addEventListener('storage', sincronizarDesdeOtraVentana);
}

export const devToolsStore = {
    isToggleAvailable() {
        return TOGGLE_AVAILABLE;
    },
    isNonProd() {
        return BUILD_IS_NON_PROD && !previewingProd;
    },
    isPreviewingProd() {
        return previewingProd;
    },
    setPreviewingProd(value) {
        const next = Boolean(value) && TOGGLE_AVAILABLE;
        if (next === previewingProd) return;
        previewingProd = next;
        persist(PREVIEW_KEY, next);
        emitChange();
    },
    isAnalyticsPanelOpen() {
        return analyticsPanelOpen && TOGGLE_AVAILABLE && !previewingProd;
    },
    setAnalyticsPanelOpen(value) {
        const next = Boolean(value) && TOGGLE_AVAILABLE;
        if (next === analyticsPanelOpen) return;
        analyticsPanelOpen = next;
        persist(ANALYTICS_KEY, next);
        emitChange();
    },
    isInFrame() {
        return EN_MARCO;
    },
    getPantalla() {
        return EN_MARCO ? null : pantalla;
    },
    setPantalla(value) {
        const next = TOGGLE_AVAILABLE && PANTALLAS[value] ? value : null;
        if (next === pantalla) return;
        pantalla = next;
        persistirPantalla(next);
        emitChange();
    },
    subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },
};
