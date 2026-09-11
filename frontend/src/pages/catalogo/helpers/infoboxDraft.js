export const MAX_ROWS = 12;
export const MAX_LABEL = 80;

const humanize = (field) => {
    const clean = String(field || '').replace(/[_-]+/g, ' ').trim();
    if (!clean) return '';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const emptyDraft = () => ({ headerField: null, list: [], cards: [] });

const formatoDe = (row) => (row?.formato === 'anio' ? { formato: 'anio' } : {});

export const draftFromConfig = (config) => {
    if (!config || typeof config !== 'object') return emptyDraft();
    return {
        headerField: config.headerField || null,
        list: (config.list || [])
            .filter((row) => row?.field)
            .slice(0, MAX_ROWS)
            .map((row) => ({ field: row.field, label: row.label || humanize(row.field), ...formatoDe(row) })),
        cards: (config.cards || [])
            .filter((card) => card?.field)
            .slice(0, MAX_ROWS)
            .map((card) => ({ field: card.field, label: card.label || humanize(card.field) })),
    };
};

const usedFields = (draft) => new Set([
    ...(draft.headerField ? [draft.headerField] : []),
    ...draft.list.map((row) => row.field),
    ...draft.cards.map((card) => card.field),
]);

export const availableFields = (columns, draft) => {
    const used = usedFields(draft);
    return (columns || []).filter((field) => !used.has(field));
};

export const addField = (draft, zone, field) => {
    if (zone === 'header') return { ...draft, headerField: field };
    if (draft[zone].length >= MAX_ROWS) return draft;
    return { ...draft, [zone]: [...draft[zone], { field, label: humanize(field) }] };
};

export const removeField = (draft, zone, field) => {
    if (zone === 'header') return { ...draft, headerField: null };
    return { ...draft, [zone]: draft[zone].filter((row) => row.field !== field) };
};

export const renameField = (draft, zone, field, label) => ({
    ...draft,
    [zone]: draft[zone].map((row) => (row.field === field ? { ...row, label: label.slice(0, MAX_LABEL) } : row)),
});

export const reorderZone = (draft, zone, from, to) => {
    const rows = [...draft[zone]];
    const [moved] = rows.splice(from, 1);
    rows.splice(to, 0, moved);
    return { ...draft, [zone]: rows };
};

export const draftToConfig = (draft) => {
    const config = {};
    if (draft.headerField) config.headerField = draft.headerField;
    if (draft.list.length) {
        config.list = draft.list.map((row) => ({ field: row.field, label: row.label.trim(), ...formatoDe(row) }));
    }
    if (draft.cards.length) {
        config.cards = draft.cards.map((card) => ({ field: card.field, label: card.label.trim() }));
    }
    const order = [];
    if (draft.cards.length) order.push('cards');
    if (draft.list.length) order.push('list');
    if (order.length > 1) config.blockOrder = order;
    return config;
};

export const draftIsEmpty = (draft) => !draft.headerField && !draft.list.length && !draft.cards.length;

export const draftHasBlankLabel = (draft) => [...draft.list, ...draft.cards]
    .some((row) => !row.label || !row.label.trim());
