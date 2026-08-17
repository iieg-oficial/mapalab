export const HEXBIN_RESOLUTION_BY_ZOOM = [
    { maxZoom: 6, resolution: 4 },
    { maxZoom: 8, resolution: 5 },
    { maxZoom: 10, resolution: 6 },
    { maxZoom: 11, resolution: 7 },
    { maxZoom: 13, resolution: 8 },
    { maxZoom: 15, resolution: 9 },
    { maxZoom: 17, resolution: 10 }
];

export const HEXBIN_MAX_RESOLUTION = 11;

export const HEXBIN_CELL_SIDE_METERS = {
    4: 28439,
    5: 10751,
    6: 4064,
    7: 1536,
    8: 581,
    9: 219,
    10: 83,
    11: 31
};

export const resolutionForZoom = (zoom) => {
    if (!Number.isFinite(zoom)) return HEXBIN_RESOLUTION_BY_ZOOM[1].resolution;
    const match = HEXBIN_RESOLUTION_BY_ZOOM.find(entry => zoom <= entry.maxZoom);
    return match ? match.resolution : HEXBIN_MAX_RESOLUTION;
};
