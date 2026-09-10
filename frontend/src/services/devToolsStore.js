const PREVIEW_KEY = 'devtools-preview-prod';
const ANALYTICS_KEY = 'devtools-analytics-panel';

const APP_ENV = import.meta.env.VITE_APP_ENV;
const BUILD_IS_NON_PROD = ['dev', 'beta'].includes(APP_ENV);
const TOGGLE_AVAILABLE = APP_ENV === 'dev';

const listeners = new Set();

const readFlag = (key) => {
    if (!TOGGLE_AVAILABLE) return false;
    try {
        return sessionStorage.getItem(key) === 'true';
    } catch {
        return false;
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

const emitChange = () => {
    listeners.forEach(fn => fn());
};

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
    subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },
};
