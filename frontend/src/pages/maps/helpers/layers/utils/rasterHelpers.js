export const RASTER_YEAR = new Date().getFullYear();

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
