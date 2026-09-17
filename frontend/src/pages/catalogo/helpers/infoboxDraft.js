export const MAX_ROWS = 12;
export const MAX_LABEL = 80;

const humanize = (field) => {
    const clean = String(field || '').replace(/[_-]+/g, ' ').trim();
    if (!clean) return '';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const composeFields = (compose) => (Array.isArray(compose) ? compose : [])
    .map((part) => (typeof part === 'string' ? part : part?.field))
    .filter(Boolean);

const composeDisplay = (compose) => composeFields(compose).join(' + ');

const headerFields = (headerField) => {
    if (!headerField) return [];
    if (typeof headerField === 'string') return [headerField];
    return composeFields(headerField.compose);
};

export const headerDisplay = (headerField) => headerFields(headerField).join(' + ');

const rowFields = (row) => (row?.field ? [row.field] : composeFields(row?.compose));

const emptyDraft = () => ({ headerField: null, list: [], cards: [] });

const rowFromConfig = (row, idx) => {
    if (row?.field) {
        return {
            key: row.field,
            field: row.field,
            display: row.field,
            label: row.label || humanize(row.field),
            ...(row.formato === 'anio' ? { formato: 'anio' } : {}),
        };
    }
    const display = composeDisplay(row?.compose);
    if (!display) return null;
    return {
        key: `compose:${idx}`,
        compose: row.compose,
        sep: row.sep,
        op: row.op,
        display,
        label: row.label || humanize(display),
    };
};

const zoneFromConfig = (rows) => (rows || [])
    .map(rowFromConfig)
    .filter(Boolean)
    .slice(0, MAX_ROWS);

export const draftFromConfig = (config) => {
    if (!config || typeof config !== 'object') return emptyDraft();
    return {
        headerField: config.headerField || null,
        list: zoneFromConfig(config.list),
        cards: zoneFromConfig(config.cards),
    };
};

const usedFields = (draft) => new Set([
    ...headerFields(draft.headerField),
    ...draft.list.flatMap(rowFields),
    ...draft.cards.flatMap(rowFields),
]);

export const availableFields = (columns, draft) => {
    const used = usedFields(draft);
    return (columns || []).filter((field) => !used.has(field));
};

export const addField = (draft, zone, field) => {
    if (zone === 'header') return { ...draft, headerField: field };
    if (draft[zone].length >= MAX_ROWS) return draft;
    const row = { key: field, field, display: field, label: humanize(field) };
    return { ...draft, [zone]: [...draft[zone], row] };
};

export const removeField = (draft, zone, key) => {
    if (zone === 'header') return { ...draft, headerField: null };
    return { ...draft, [zone]: draft[zone].filter((row) => row.key !== key) };
};

export const renameField = (draft, zone, key, label) => ({
    ...draft,
    [zone]: draft[zone].map((row) => (row.key === key ? { ...row, label: label.slice(0, MAX_LABEL) } : row)),
});

export const reorderZone = (draft, zone, from, to) => {
    const rows = [...draft[zone]];
    const [moved] = rows.splice(from, 1);
    rows.splice(to, 0, moved);
    return { ...draft, [zone]: rows };
};

const rowToConfig = (row) => {
    const label = row.label.trim();
    if (row.field) return { field: row.field, label, ...(row.formato === 'anio' ? { formato: 'anio' } : {}) };
    const config = { compose: row.compose };
    if (typeof row.sep === 'string') config.sep = row.sep;
    if (row.op) config.op = row.op;
    config.label = label;
    return config;
};

export const draftToConfig = (draft) => {
    const config = {};
    if (draft.headerField) config.headerField = draft.headerField;
    if (draft.list.length) config.list = draft.list.map(rowToConfig);
    if (draft.cards.length) config.cards = draft.cards.map(rowToConfig);
    const order = [];
    if (draft.cards.length) order.push('cards');
    if (draft.list.length) order.push('list');
    if (order.length > 1) config.blockOrder = order;
    return config;
};

export const draftIsEmpty = (draft) => !draft.headerField && !draft.list.length && !draft.cards.length;

export const draftHasBlankLabel = (draft) => [...draft.list, ...draft.cards]
    .some((row) => !row.label || !row.label.trim());
