const TEXT_KEY_PREFIX = 'text:';

export const isTextKey = (k) => typeof k === 'string' && k.startsWith(TEXT_KEY_PREFIX);
export const textIdOf = (k) => k.slice(TEXT_KEY_PREFIX.length);
export const mkTextKey = (id) => `${TEXT_KEY_PREFIX}${id}`;

const ALLOWED_HREF_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:'];
const TOKEN_PATTERN = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

export const resolveHref = (template, getValue) => {
    if (typeof template !== 'string' || !template.trim()) return null;
    let unresolved = false;
    const replaced = template.replace(TOKEN_PATTERN, (_, name) => {
        const val = typeof getValue === 'function' ? getValue(name) : '';
        if (val === '' || val == null) {
            unresolved = true;
            return '';
        }
        return encodeURIComponent(String(val));
    });
    if (unresolved) return null;
    const trimmed = replaced.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('/')) return trimmed;
    try {
        const url = new URL(trimmed);
        if (!ALLOWED_HREF_SCHEMES.includes(url.protocol)) return null;
        return trimmed;
    } catch {
        return null;
    }
};

const normalizeTextBlocks = (cfg) => {
    if (!cfg || typeof cfg !== 'object' || !Array.isArray(cfg.text) || cfg.text.length === 0) {
        return cfg;
    }
    const isLegacy = !Array.isArray(cfg.text[0]?.items);
    if (!isLegacy) return cfg;
    const next = { ...cfg, text: [{ id: 't0', items: cfg.text }] };
    if (Array.isArray(cfg.blockOrder)) {
        next.blockOrder = cfg.blockOrder.map((k) => (k === 'text' ? mkTextKey('t0') : k));
    }
    return next;
};

const LEGACY_LABELS_STYLE = { color: '#7B61FF', bg: '#F3F0FF' };

const normalizeLegacyLabels = (cfg) => {
    if (!cfg || typeof cfg !== 'object' || !Array.isArray(cfg.labels) || cfg.labels.length === 0) {
        return cfg;
    }
    const migrated = { fields: cfg.labels.slice(), ...LEGACY_LABELS_STYLE };
    const labelGroups = Array.isArray(cfg.labelGroups) ? [migrated, ...cfg.labelGroups] : [migrated];
    const { labels: _drop, ...rest } = cfg;
    const next = { ...rest, labelGroups };
    if (Array.isArray(cfg.blockOrder)) {
        const filtered = cfg.blockOrder.filter((k) => k !== 'labels');
        next.blockOrder = filtered.length ? filtered : undefined;
        if (!next.blockOrder) delete next.blockOrder;
    }
    return next;
};

export const normalizeFinalConfig = (cfg) => normalizeLegacyLabels(normalizeTextBlocks(cfg));
