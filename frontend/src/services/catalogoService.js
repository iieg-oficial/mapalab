const API_HOST = (import.meta.env.VITE_BACKEND_API_HOST || '/api/').replace(/\/+$/, '');
const GEOSERVER_BASE = (import.meta.env.VITE_GEOSERVER_URL || '').replace(/\/+$/, '');

const buildUrl = (path) => `${API_HOST}/${path.replace(/^\/+/, '')}`;

export const fetchCatalogoCapas = async (signal) => {
    const res = await fetch(buildUrl('catalogo/capas'), { signal });
    if (!res.ok) throw new Error(`GET /catalogo/capas fallo ${res.status}`);
    return res.json();
};

export const fetchCatalogoInstituciones = async (signal) => {
    const res = await fetch(buildUrl('catalogo/instituciones'), { signal });
    if (!res.ok) throw new Error(`GET /catalogo/instituciones fallo ${res.status}`);
    return res.json();
};

export const fetchCatalogoCapa = async (slug, signal) => {
    const res = await fetch(buildUrl(`catalogo/capas/${encodeURIComponent(slug)}`), { signal });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GET /catalogo/capas/${slug} fallo ${res.status}`);
    return res.json();
};

export const fetchCapaPeriodicidad = async (capa, signal) => {
    const url = new URL(`${API_HOST}/periodicity/`, window.location.origin);
    url.searchParams.set('workspace', capa.geoserverWorkspace);
    url.searchParams.set('layer', capa.geoserverLayer);
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) throw new Error(`GET /periodicity fallo ${res.status}`);
    const data = await res.json();
    const periodicidad = data?.periodicity;
    return periodicidad && Object.keys(periodicidad).length ? periodicidad : null;
};

const MARIACHI_PUBLIC = (import.meta.env.VITE_MARIACHI_PUBLIC_API_HOST || '/api/public/').replace(/\/+$/, '');

export const postInfoboxPropuesta = async ({ capaSlug, config, comentario, website }, signal) => {
    const res = await fetch(`${MARIACHI_PUBLIC}/mapalab/catalogo/infobox-propuestas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capaSlug, config, comentario, website }),
        signal,
    });
    if (res.status === 429) throw new Error('Ya enviaste varias propuestas. Intenta más tarde.');
    if (!res.ok) {
        const data = await res.json().catch(() => null);
        const detail = typeof data?.detail === 'string' ? data.detail : null;
        throw new Error(detail || 'No se pudo enviar la propuesta.');
    }
    return res.json();
};

export const fetchCapaSampleFeature = async (capa, signal) => {
    const gsWorkspace = capa.geoserverWorkspace;
    const url = new URL(`${GEOSERVER_BASE}/${gsWorkspace}/wfs`, window.location.origin);
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('version', '1.1.0');
    url.searchParams.set('request', 'GetFeature');
    url.searchParams.set('typeName', `${gsWorkspace}:${capa.geoserverLayer}`);
    url.searchParams.set('outputFormat', 'application/json');
    url.searchParams.set('maxFeatures', '1');
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.features?.[0] || null;
};

export const capaHasGeometry = async (capa, signal) => {
    try {
        const gsWorkspace = capa.geoserverWorkspace;
        const url = new URL(`${GEOSERVER_BASE}/${gsWorkspace}/wfs`, window.location.origin);
        url.searchParams.set('service', 'WFS');
        url.searchParams.set('version', '1.1.0');
        url.searchParams.set('request', 'DescribeFeatureType');
        url.searchParams.set('typeName', `${gsWorkspace}:${capa.geoserverLayer}`);
        url.searchParams.set('outputFormat', 'application/json');
        const res = await fetch(url.toString(), { signal });
        if (!res.ok) return true;
        const data = await res.json();
        const props = data?.featureTypes?.[0]?.properties || [];
        return props.some((p) => typeof p.type === 'string' && p.type.startsWith('gml:'));
    } catch {
        return true;
    }
};
