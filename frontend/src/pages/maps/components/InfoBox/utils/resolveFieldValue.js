import { MULTIVALOR_SPLIT } from '@constants/multivalor';

const DEFAULT_JOIN_SEPARATOR = ', ';

const isBlank = (value) => value === null || value === undefined || String(value).trim() === '';

const normalizeParts = (compose) => (Array.isArray(compose) ? compose : [])
    .map((part) => (typeof part === 'string' ? { field: part } : part))
    .filter((part) => part && typeof part === 'object' && part.field);

export const isComposedDef = (def) => !!def
    && typeof def === 'object'
    && !def.field
    && Array.isArray(def.compose)
    && normalizeParts(def.compose).length > 0;

export const isJoinedDef = (def) => isComposedDef(def) && def.op !== 'sum';

export const splitMultivalue = (value) => {
    if (typeof value !== 'string') return [];
    return value.split(MULTIVALOR_SPLIT).map((item) => item.trim()).filter(Boolean);
};

export const makeValueResolver = (properties) => {
    const byLowerCase = new Map();
    Object.keys(properties || {}).forEach((key) => {
        const lower = key.toLowerCase();
        if (!byLowerCase.has(lower)) byLowerCase.set(lower, key);
    });

    const readField = (field) => {
        if (!field) return '';
        const key = byLowerCase.get(String(field).toLowerCase());
        return key === undefined ? '' : properties[key];
    };

    const sumParts = (parts) => {
        let total = 0;
        let found = false;
        parts.forEach((part) => {
            const raw = readField(part.field);
            if (isBlank(raw)) return;
            const numero = Number(raw);
            if (!Number.isFinite(numero)) return;
            total += numero;
            found = true;
        });
        return found ? total : '';
    };

    const joinParts = (parts, separator) => {
        const pieces = [];
        parts.forEach((part) => {
            const raw = readField(part.field);
            if (isBlank(raw)) return;
            pieces.push(`${part.prefix || ''}${String(raw).trim()}${part.suffix || ''}`);
        });
        return pieces.length ? pieces.join(separator) : '';
    };

    const resolve = (def) => {
        if (def === null || def === undefined) return '';
        if (typeof def === 'string') return readField(def);
        if (typeof def !== 'object') return '';
        if (def.field) return readField(def.field);
        const parts = normalizeParts(def.compose);
        if (!parts.length) return '';
        if (def.op === 'sum') return sumParts(parts);
        return joinParts(parts, typeof def.sep === 'string' ? def.sep : DEFAULT_JOIN_SEPARATOR);
    };

    return { resolve, readField };
};
