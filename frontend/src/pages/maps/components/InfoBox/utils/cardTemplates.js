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
        config.labelGroups = [{ fields: [municipioMatch.field] }];
    }

    if (remainingFields.length > 0) {
        config.list = remainingFields.slice(0, 6).map(field => ({
            label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            field
        }));
    }

    if (locationMatch) {
        config.iconText = { icon: 'location', field: locationMatch.field };
    }

    return Object.keys(config).length > 0 ? config : null;
};

const createTDL = ({ title, list }) => ({
    headerField: title,
    list
});

const createTDLEV = ({ title, list, stats }) => ({
    headerField: title,
    list,
    cards: stats,
    cardsColumns: 1
});

const createTDEMEC = ({ title, municipio, caracteristica }) => ({
    headerField: title,
    labelGroups: [
        { fields: Array.isArray(municipio) ? municipio : [municipio] },
        { fields: Array.isArray(caracteristica) ? caracteristica : [caracteristica] }
    ]
});

const createTDEMEV = ({ title, municipio, stats }) => ({
    headerField: title,
    labelGroups: [
        { fields: Array.isArray(municipio) ? municipio : [municipio] }
    ],
    cards: stats,
    cardsColumns: 1
});

const createTDEMECL = ({ title, municipio, caracteristica, list }) => ({
    headerField: title,
    labelGroups: [
        { fields: Array.isArray(municipio) ? municipio : [municipio] },
        { fields: Array.isArray(caracteristica) ? caracteristica : [caracteristica] }
    ],
    list
});

const createTDEMECLU = ({ title, municipio, caracteristica, list, ubicacion }) => ({
    headerField: title,
    labelGroups: [
        { fields: Array.isArray(municipio) ? municipio : [municipio] },
        { fields: Array.isArray(caracteristica) ? caracteristica : [caracteristica] }
    ],
    list,
    iconText: { icon: 'location', field: ubicacion }
});

const buildLabelGroups = (municipio, caracteristica, splitMunicipio) => {
    const groups = [];
    const munFields = Array.isArray(municipio) ? municipio : [municipio];
    if (munFields.length > 0 && munFields[0]) {
        groups.push({ fields: munFields, ...(splitMunicipio && { splitValues: true }) });
    }
    const carFields = Array.isArray(caracteristica) ? caracteristica : [caracteristica];
    if (carFields.length > 0 && carFields[0]) {
        groups.push({ fields: carFields });
    }
    return groups.length > 0 ? groups : undefined;
};

const createTDEMECLUEV = ({ title, municipio, caracteristica, list, ubicacion, stats, text, splitMunicipio }) => ({
    headerField: title,
    labelGroups: buildLabelGroups(municipio, caracteristica, splitMunicipio),
    list,
    iconText: ubicacion ? { icon: 'location', field: ubicacion } : undefined,
    ...(text && { text }),
    cards: stats,
    cardsColumns: 1
});

const createTDEMECLUEH = ({ title, municipio, caracteristica, list, ubicacion, stats, text, columns = 2, splitMunicipio }) => ({
    headerField: title,
    labelGroups: buildLabelGroups(municipio, caracteristica, splitMunicipio),
    list,
    iconText: ubicacion ? { icon: 'location', field: ubicacion } : undefined,
    ...(text && { text }),
    cards: stats,
    cardsColumns: columns
});

const createTELEV = ({ title, list, stats }) => ({
    headerField: title,
    list,
    cards: stats,
    cardsColumns: 1
});

const createTEEMEV = ({ title, municipio, stats }) => ({
    headerField: title,
    labelGroups: [
        { fields: Array.isArray(municipio) ? municipio : [municipio] }
    ],
    cards: stats,
    cardsColumns: 1
});

const createTEEMECL = ({ title, municipio, caracteristica, list }) => ({
    headerField: title,
    labelGroups: [
        { fields: Array.isArray(municipio) ? municipio : [municipio] },
        { fields: Array.isArray(caracteristica) ? caracteristica : [caracteristica] }
    ],
    list
});

const createTEEMLEV = ({ title, municipio, list, stats, text }) => ({
    headerField: title,
    labelGroups: [
        { fields: Array.isArray(municipio) ? municipio : [municipio] }
    ],
    list,
    ...(text && { text }),
    cards: stats,
    cardsColumns: 1
});

const createTDEMLEV = ({ title, municipio, list, stats, text, splitMunicipio }) => ({
    headerField: title,
    labelGroups: [
        { fields: Array.isArray(municipio) ? municipio : [municipio], ...(splitMunicipio && { splitValues: true }) }
    ],
    list,
    ...(text && { text }),
    cards: stats,
    cardsColumns: 1
});

const createTEEMECEV = ({ title, municipio, caracteristica, stats }) => ({
    headerField: title,
    labelGroups: [
        { fields: Array.isArray(municipio) ? municipio : [municipio] },
        { fields: Array.isArray(caracteristica) ? caracteristica : [caracteristica] }
    ],
    cards: stats,
    cardsColumns: 1
});

const createTEEMECLEV = ({ title, municipio, caracteristica, list, stats }) => ({
    headerField: title,
    labelGroups: [
        { fields: Array.isArray(municipio) ? municipio : [municipio] },
        { fields: Array.isArray(caracteristica) ? caracteristica : [caracteristica] }
    ],
    list,
    cards: stats,
    cardsColumns: 1
});

const createTEEAEMECL = ({ title, accion, municipio, caracteristica, list }) => ({
    headerField: title,
    labels: Array.isArray(accion) ? accion : [accion],
    labelGroups: [
        { fields: Array.isArray(municipio) ? municipio : [municipio] },
        { fields: Array.isArray(caracteristica) ? caracteristica : [caracteristica] }
    ],
    list
});

const createTEEC = ({ title, caracteristica }) => ({
    headerField: title,
    labelGroups: [
        { fields: Array.isArray(caracteristica) ? caracteristica : [caracteristica] }
    ]
});

export const cardTemplates = {
    TDL: createTDL,
    TDLEV: createTDLEV,
    TDEMEC: createTDEMEC,
    TDEMEV: createTDEMEV,
    TDEMLEV: createTDEMLEV,
    TDEMECL: createTDEMECL,
    TDEMECLU: createTDEMECLU,
    TDEMECLUEV: createTDEMECLUEV,
    TDEMECLUEH: createTDEMECLUEH,
    TELEV: createTELEV,
    TEEMEV: createTEEMEV,
    TEEMECL: createTEEMECL,
    TEEMLEV: createTEEMLEV,
    TEEMECEV: createTEEMECEV,
    TEEMECLEV: createTEEMECLEV,
    TEEAEMECL: createTEEAEMECL,
    TEEC: createTEEC
};

export const createCardConfig = (template, fields) => {
    const factory = cardTemplates[template];
    if (!factory) {
        console.warn(`Template "${template}" no encontrada, usando DEFAULT`);
        return null;
    }
    return factory(fields);
};

export { generateDefaultConfig };
