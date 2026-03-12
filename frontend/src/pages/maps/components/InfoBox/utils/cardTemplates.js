const COMMON_TITLE_FIELDS = ['nombre', 'name', 'titulo', 'title', 'descripcion', 'delito', 'tipo'];
const COMMON_MUNICIPIO_FIELDS = ['municipio', 'municipality', 'mpio', 'nom_mun'];
const COMMON_LOCATION_FIELDS = ['domicilio', 'direccion', 'address', 'ubicacion', 'calle'];
const EXCLUDED_FIELDS = ['gid', 'id', 'fid', 'ogc_fid', 'geom', 'geometry', 'the_geom', 'shape'];

const findFieldValue = (properties, possibleFields) => {
    if (!properties) return null;
    const propsLower = Object.keys(properties).reduce((acc, key) => {
        acc[key.toLowerCase()] = key;
        return acc;
    }, {});

    for (const field of possibleFields) {
        const originalKey = propsLower[field.toLowerCase()];
        if (originalKey && properties[originalKey]) {
            return { field: originalKey, value: properties[originalKey] };
        }
    }
    return null;
};

const generateDefaultConfig = (properties) => {
    if (!properties) return null;

    const titleMatch = findFieldValue(properties, COMMON_TITLE_FIELDS);
    const municipioMatch = findFieldValue(properties, COMMON_MUNICIPIO_FIELDS);
    const locationMatch = findFieldValue(properties, COMMON_LOCATION_FIELDS);

    const usedFields = new Set([
        titleMatch?.field,
        municipioMatch?.field,
        locationMatch?.field,
        ...EXCLUDED_FIELDS
    ].filter(Boolean).map(f => f.toLowerCase()));

    const remainingFields = Object.keys(properties)
        .filter(key => !usedFields.has(key.toLowerCase()))
        .filter(key => properties[key] !== null && properties[key] !== undefined && properties[key] !== '');

    const config = {};

    if (titleMatch) {
        config.headerField = titleMatch.field;
    }

    if (municipioMatch) {
        config.labelGroups = [createMunicipioGroup(municipioMatch.field)];
    }

    if (remainingFields.length > 0) {
        config.list = remainingFields.slice(0, 6).map(field => ({
            label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            field
        }));
    }

    if (locationMatch) {
        config.iconText = [{ icon: 'ubicacion', field: locationMatch.field }];
    }

    return Object.keys(config).length > 0 ? config : null;
};

const toArray = (v) => Array.isArray(v) ? v : [v];

export const MUNICIPIO_STYLE = { color: '#FF8300', bg: '#FFF2E5' };
export const CARACTERISTICA_STYLE = { color: '#7B61FF', bg: '#F3F0FF' };

const createMunicipioGroup = (municipio) => ({
    fields: toArray(municipio),
    ...MUNICIPIO_STYLE
});

const createCaracteristicaGroup = (caracteristica) => ({
    fields: toArray(caracteristica),
    ...CARACTERISTICA_STYLE
});

const createTDEMEC = ({ title, municipio, caracteristica }) => ({
    headerField: title,
    labelGroups: [
        createMunicipioGroup(municipio),
        createCaracteristicaGroup(caracteristica)
    ]
});

const createTDEMECLU = ({ title, municipio, caracteristica, list, iconTexts = [] }) => ({
    headerField: title,
    labelGroups: [
        createMunicipioGroup(municipio),
        createCaracteristicaGroup(caracteristica)
    ],
    list,
    iconText: iconTexts
});

const createTDEMECLUEV = ({ title, municipio, caracteristica, list, iconTexts = [], stats, text }) => ({
    headerField: title,
    labelGroups: [
        createMunicipioGroup(municipio),
        createCaracteristicaGroup(caracteristica)
    ],
    list,
    iconText: iconTexts.length > 0 ? iconTexts : undefined,
    ...(text && { text }),
    cards: stats,
    cardsColumns: 1
});

const createTEEMLXEV = ({ title, municipio, list, text, stats }) => ({
    headerField: title,
    labelGroups: [
        createMunicipioGroup(municipio)
    ],
    list,
    ...(text && { text }),
    cards: stats,
    cardsColumns: 1
});

const createTEEC = ({ title, caracteristica, staticLabel }) => ({
    headerField: title,
    labelGroups: [
        ...(staticLabel ? [{ staticValues: [staticLabel], ...CARACTERISTICA_STYLE }] : []),
        createCaracteristicaGroup(caracteristica)
    ]
});

export const createMunicipioConfig = ({ title, municipio = 'nombre', text, stats, columns = 1 }) => ({
    headerField: title,
    labelGroups: [
        createMunicipioGroup(municipio),
        { fields: ['fecha'], ...CARACTERISTICA_STYLE }
    ],
    ...(text && { text: [{ label: text }] }),
    cards: stats,
    cardsColumns: columns
});

export const cardTemplates = {
    TDEMEC: createTDEMEC,
    TDEMECLU: createTDEMECLU,
    TDEMECLUEV: createTDEMECLUEV,
    TEEMLXEV: createTEEMLXEV,
    TEEC: createTEEC,
    generateDefaultConfig
};
