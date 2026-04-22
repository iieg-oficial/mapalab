export const RASTER_YEAR = 2025;

export const RASTER_TAGS = [
    'recursos',
    'clima',
    'calor',
    'frio',
    'grados',
    'ambiente',
    'meteorologia',
    'lluvia',
    'precipitacion',
    'temperatura'
];

export const buildMonthlyTime = (years = [RASTER_YEAR]) => {
    const result = {};
    years.forEach(year => {
        result[year] = {};
        for (let m = 1; m <= 12; m++) {
            result[year][m] = `${year}-${String(m).padStart(2, '0')}-01`;
        }
    });
    return result;
};

export const createClimaAnnualConfig = (title, description, cardLabel) => ({
    headerField: title,
    labelGroups: [{ staticValues: [`${RASTER_YEAR}`] }],
    ...(description ? { text: [{ label: description }] } : {}),
    cards: [{ label: cardLabel, field: 'GRAY_INDEX', decimals: 1 }],
    cardsColumns: 1
});

export const createClimaMonthlyConfig = (title, description, cardLabel) => ({
    headerField: title,
    labelGroups: [{ staticValues: [{ dynamic: 'rasterDate', fallback: `${RASTER_YEAR}` }] }],
    ...(description ? { text: [{ label: description }] } : {}),
    cards: [{ label: cardLabel, field: 'GRAY_INDEX', decimals: 1 }],
    cardsColumns: 1
});
