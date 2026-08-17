import { latLngToCell, cellToBoundary } from 'h3-js';

export const H3_MIN_RESOLUTION = 4;
export const H3_MAX_RESOLUTION = 11;

export const clampResolution = (resolution) => {
    if (!Number.isFinite(resolution)) return H3_MIN_RESOLUTION;
    return Math.min(H3_MAX_RESOLUTION, Math.max(H3_MIN_RESOLUTION, Math.round(resolution)));
};

export const cellOf = (lonLat, resolution) => {
    if (!Array.isArray(lonLat)) return null;
    const [lon, lat] = lonLat;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return latLngToCell(lat, lon, clampResolution(resolution));
};

export const aggregateToH3 = (lonLats, resolution) => {
    const counts = new Map();
    const safeResolution = clampResolution(resolution);

    (lonLats || []).forEach((point) => {
        if (!Array.isArray(point)) return;
        const [lon, lat] = point;
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return;

        const cell = latLngToCell(lat, lon, safeResolution);
        counts.set(cell, (counts.get(cell) || 0) + 1);
    });

    return counts;
};

export const cellRing = (cell) => cellToBoundary(cell, true);

export const quantileBreaks = (values, classes) => {
    const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
    if (sorted.length === 0) return [];

    const breaks = [];
    for (let i = 1; i < classes; i += 1) {
        const position = (sorted.length - 1) * (i / classes);
        breaks.push(sorted[Math.round(position)]);
    }

    return breaks.filter((value, index, all) => index === 0 || value > all[index - 1]);
};

const EXCLUDED_BREAKDOWN_FIELDS = new Set([
    'fid', 'id', 'gid', 'objectid', 'geom', 'the_geom', 'geom_iieg', 'geom_inegi',
    'x_6368', 'y_6368', 'longitud', 'latitud', 'lon', 'lat'
]);

const MAX_BREAKDOWN_VALUES = 12;

export const chooseBreakdownField = (features) => {
    const sample = (features || []).slice(0, 500);
    if (sample.length === 0) return null;

    const candidates = new Map();

    sample.forEach((feature) => {
        const properties = feature.getProperties?.() || {};
        Object.entries(properties).forEach(([field, value]) => {
            if (EXCLUDED_BREAKDOWN_FIELDS.has(field.toLowerCase())) return;
            if (typeof value !== 'string' || value.trim() === '') return;
            if (!candidates.has(field)) candidates.set(field, new Set());
            candidates.get(field).add(value);
        });
    });

    let best = null;
    candidates.forEach((values, field) => {
        const unique = values.size;
        if (unique < 2 || unique > MAX_BREAKDOWN_VALUES) return;
        if (!best || unique < best.unique) best = { field, unique };
    });

    return best?.field || null;
};

export const breakdownOf = (features, field) => {
    if (!field) return [];

    const counts = new Map();
    features.forEach((feature) => {
        const value = feature.get?.(field);
        if (typeof value !== 'string' || value.trim() === '') return;
        counts.set(value, (counts.get(value) || 0) + 1);
    });

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([value, count]) => ({ value, count }));
};

export const classOf = (count, breaks) => {
    let index = 0;
    while (index < breaks.length && count > breaks[index]) index += 1;
    return index;
};
