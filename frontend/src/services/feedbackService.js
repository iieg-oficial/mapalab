const API_BASE = (import.meta.env.VITE_MARIACHI_PUBLIC_API_HOST || '/api/public/').replace(/\/?$/, '/');

const buildUrl = (path) => `${API_BASE}${path.startsWith('/') ? path.slice(1) : path}`;

export const submitReporte = async ({
    tipo,
    mensaje,
    email,
    screenshotBlob,
    sourceApp = 'mapalab',
    sourceRoute,
    sourceContext = {}
}) => {
    const form = new FormData();
    form.append('tipo', tipo);
    form.append('mensaje', mensaje);
    form.append('source_app', sourceApp);
    if (sourceRoute) form.append('source_route', sourceRoute);
    form.append('source_context', JSON.stringify(sourceContext));
    if (email) form.append('email_contacto', email);
    form.append('website', '');
    if (screenshotBlob) {
        const ext = screenshotBlob.type === 'image/jpeg' ? 'jpg' : 'png';
        form.append('screenshot', screenshotBlob, `reporte.${ext}`);
    }

    const res = await fetch(buildUrl('reportes'), {
        method: 'POST',
        body: form
    });

    if (res.status === 429) {
        const retry = res.headers.get('Retry-After');
        const err = new Error('rate_limited');
        err.code = 'rate_limited';
        err.retryAfter = retry ? parseInt(retry, 10) : null;
        throw err;
    }

    if (!res.ok) {
        const err = new Error(`POST /reportes fallo ${res.status}`);
        err.code = 'request_failed';
        err.status = res.status;
        throw err;
    }

    return res.json();
};
