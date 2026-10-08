const originOf = (url) => {
    try {
        const { origin } = new URL(url);
        return origin && origin !== 'null' ? origin : null;
    } catch {
        return null;
    }
};


const isEmbedded = () => {
    if (typeof window === 'undefined') return false;
    try {
        return window.parent && window.parent !== window;
    } catch {
        return false;
    }
};


export const detectParentOrigin = () => {
    if (!isEmbedded()) return null;
    const ancestors = window.location.ancestorOrigins;
    if (ancestors && ancestors.length > 0) {
        const origin = originOf(ancestors[0]);
        if (origin) return origin;
    }
    return document.referrer ? originOf(document.referrer) : null;
};


export const isMessageFromParent = (event) => {
    if (!isEmbedded() || !event || event.source !== window.parent) return false;
    const parentOrigin = detectParentOrigin();
    return Boolean(parentOrigin) && event.origin === parentOrigin;
};


const post = (type, payload) => {
    if (!isEmbedded()) return;
    try {
        window.parent.postMessage({ type, payload: payload || {} }, detectParentOrigin() || '*');
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
