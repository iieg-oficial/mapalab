const EQUALITY = /^\[\s*([A-Za-z_]\w*)\s*=\s*'([^']*)'\s*\]$/;
const IS_NULL = /^\[\s*([A-Za-z_]\w*)\s+IS\s+NULL\s*\]$/i;
const SCALE = 1.4;
const MAX_SIZE = 32;

const pointOf = (rule) => (rule?.symbolizers || []).map(symbolizer => symbolizer?.Point).find(Boolean) || null;

const filterOf = (raw) => {
    const filter = String(raw || '').trim();
    if (!filter) return { type: 'all' };
    const equality = filter.match(EQUALITY);
    if (equality) return { type: 'eq', property: equality[1], value: equality[2] };
    const isNull = filter.match(IS_NULL);
    if (isNull) return { type: 'null', property: isNull[1] };
    return null;
};

export const iconSize = (size) => Math.min(MAX_SIZE, Math.round((Number(size) || 16) * SCALE));

const soloTexto = (rule) => Array.isArray(rule?.symbolizers) && rule.symbolizers.length > 0
    && rule.symbolizers.every(symbolizer => Object.keys(symbolizer).every(tipo => tipo === 'Text'));

export const parsePointRules = (legendJson) => {
    const todas = legendJson?.Legend?.[0]?.rules;
    const rules = Array.isArray(todas) ? todas.filter(rule => !soloTexto(rule)) : [];
    if (rules.length === 0) return null;
    const parsed = rules.map((rule) => {
        const point = pointOf(rule);
        const filter = filterOf(rule?.filter);
        return point?.url && filter ? { url: point.url, size: iconSize(point.size), filter } : null;
    });
    if (parsed.some(rule => rule === null)) return null;
    const properties = new Set(parsed.map(rule => rule.filter.property).filter(Boolean));
    if (properties.size > 1) return null;
    return { property: [...properties][0] || null, rules: parsed };
};

export const iconExpression = ({ property, rules }, idOf) => {
    const general = rules.findIndex(rule => rule.filter.type === 'all');
    const fallback = idOf(general >= 0 ? general : 0);
    if (!property) return fallback;
    const vistos = new Set();
    const pares = rules.flatMap((rule, index) => {
        if (rule.filter.type !== 'eq' || vistos.has(rule.filter.value)) return [];
        vistos.add(rule.filter.value);
        return [rule.filter.value, idOf(index)];
    });
    const match = pares.length ? ['match', ['to-string', ['get', property]], ...pares, fallback] : fallback;
    const nulo = rules.findIndex(rule => rule.filter.type === 'null');
    return nulo >= 0 ? ['case', ['==', ['typeof', ['get', property]], 'null'], idOf(nulo), match] : match;
};

export const publicIconUrl = (url, geoserverBase) => {
    try {
        const { pathname, search } = new URL(url);
        return `${geoserverBase}${pathname.replace(/^\/[^/]+/, '')}${search}`;
    } catch {
        return url;
    }
};

export const billboardLayout = (iconImage) => ({
    'icon-image': iconImage,
    'icon-anchor': 'bottom',
    'icon-pitch-alignment': 'viewport',
    'icon-rotation-alignment': 'viewport',
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
});
