const API_BASE = import.meta.env.VITE_BACKEND_API_HOST || '/api/';

const buildUrl = (path) => {
    const base = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`;
    return `${base}${path.startsWith('/') ? path.slice(1) : path}`;
};

export const reportClientError = ({ type, message = '', url = '' }) => {
    try {
        const body = JSON.stringify({
            type,
            url: String(url).slice(0, 2000),
            message: String(message).slice(0, 500),
            userAgent: navigator.userAgent || '',
            href: window.location.href || '',
        });
        const endpoint = buildUrl('log/client-error');
        if (navigator.sendBeacon) {
            navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
            return;
        }
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
        }).catch(() => { });
    } catch {
        return;
    }
};
