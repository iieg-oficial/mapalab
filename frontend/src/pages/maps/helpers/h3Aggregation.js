import { latLngToCell, cellToBoundary } from 'h3-js';

export const H3_MIN_RESOLUTION = 3;
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

export const classOf = (count, breaks) => {
    let index = 0;
    while (index < breaks.length && count > breaks[index]) index += 1;
    return index;
};
