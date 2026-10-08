const API_BASE = (import.meta.env.VITE_BACKEND_API_HOST || '/api/').replace(/\/?$/, '/');

const buildUrl = (path) => `${API_BASE.replace(/\/$/, '')}${path}`;

export const createShare = async (envelope) => {
    const res = await fetch(buildUrl('/shares'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envelope),
    });
    if (!res.ok) {
        const cuerpo = await res.json().catch(() => null);
        throw new Error(typeof cuerpo?.detail === 'string' ? cuerpo.detail : 'No se pudo crear el enlace');
    }
    return res.json();
};

export const fetchShare = async (shareId) => {
    const res = await fetch(buildUrl(`/shares/${encodeURIComponent(shareId)}`), {
        signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GET /shares/${shareId} ${res.status}`);
    return res.json();
};

export const pinShare = async (shareId) => {
    const res = await fetch(buildUrl(`/shares/${encodeURIComponent(shareId)}/pin`), {
        method: 'POST',
    });
    if (!res.ok) throw new Error(`POST /shares/${shareId}/pin ${res.status}`);
    return res.json();
};
