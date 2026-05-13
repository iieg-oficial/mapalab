const TARGET_ORIGIN = '*';


const isEmbedded = () => {
    if (typeof window === 'undefined') return false;
    try {
        return window.parent && window.parent !== window;
    } catch {
        return false;
    }
};


const post = (type, payload) => {
    if (!isEmbedded()) return;
    try {
        window.parent.postMessage({ type, payload: payload || {} }, TARGET_ORIGIN);
    } catch (err) {
        if (import.meta.env.DEV) {
            console.warn('postMessage failed', err);
        }
    }
};


export const postReady = (payload) => post('mapalab:ready', payload);
export const postError = (payload) => post('mapalab:error', payload);
export const postFeatureClick = (payload) => post('mapalab:feature-click', payload);
export const postViewChange = (payload) => post('mapalab:viewchange', payload);
