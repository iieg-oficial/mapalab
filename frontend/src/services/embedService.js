const BASE = import.meta.env.VITE_BACKEND_API_HOST || '/api/';


export const fetchEmbedConfig = async ({ key, layers }) => {
    const params = new URLSearchParams();
    params.set('key', key);
    if (layers?.length) params.set('layers', layers.join(','));
    const url = `${BASE.replace(/\/$/, '')}/embed/config?${params.toString()}`;
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body?.detail || `HTTP ${res.status}`;
        throw new Error(detail);
    }
    return res.json();
};
