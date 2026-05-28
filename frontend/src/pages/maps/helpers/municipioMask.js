import { Polygon } from 'ol/geom';

export const expandExtent = (extent, factor = 0.5) => {
    if (!extent || extent.length !== 4) return null;
    const [minX, minY, maxX, maxY] = extent;
    const dx = (maxX - minX) * factor;
    const dy = (maxY - minY) * factor;
    return [minX - dx, minY - dy, maxX + dx, maxY + dy];
};

export const extentToRing = (extent) => {
    if (!extent || extent.length !== 4) return null;
    const [minX, minY, maxX, maxY] = extent;
    return [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY],
    ];
};

export const extractHoleRings = (geometry) => {
    if (!geometry || typeof geometry.getType !== 'function') return [];
    const type = geometry.getType();
    if (type === 'Polygon') {
        const ring = geometry.getLinearRing?.(0);
        return ring ? [ring.getCoordinates()] : [];
    }
    if (type === 'MultiPolygon') {
        const polys = geometry.getPolygons?.() || [];
        return polys
            .map(p => p.getLinearRing?.(0)?.getCoordinates())
            .filter(Boolean);
    }
    return [];
};

export const unionGeometriesExtent = (geometries) => {
    if (!Array.isArray(geometries) || geometries.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const geom of geometries) {
        const ext = geom?.getExtent?.();
        if (!ext || ext.length !== 4) continue;
        const [x1, y1, x2, y2] = ext;
        if (x1 < minX) minX = x1;
        if (y1 < minY) minY = y1;
        if (x2 > maxX) maxX = x2;
        if (y2 > maxY) maxY = y2;
    }
    if (!isFinite(minX)) return null;
    return [minX, minY, maxX, maxY];
};

export const buildMaskPolygon = (viewExtent, geometries, padFactor = 0.5) => {
    const expanded = expandExtent(viewExtent, padFactor);
    if (!expanded) return null;
    const outer = extentToRing(expanded);
    const holes = (geometries || []).flatMap(extractHoleRings);
    return new Polygon([outer, ...holes]);
};
