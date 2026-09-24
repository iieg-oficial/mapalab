import GeoJSON from 'ol/format/GeoJSON';
import { createEmpty, extend, isEmpty, getCenter } from 'ol/extent';
import { toLonLat } from 'ol/proj';

const geoJSONFormat = new GeoJSON();

export const parseResultsFeatures = (results, { source = 'cache' } = {}) => {
    if (!Array.isArray(results) || results.length === 0) return [];
    const parsed = [];
    for (const result of results) {
        const features = source === 'visible'
            ? result?.features
            : (result?.cachedFeatures || result?.features);
        if (!features?.length) continue;
        for (const feature of features) {
            if (!feature?.geometry) continue;
            try {
                const olFeature = geoJSONFormat.readFeature(feature, {
                    dataProjection: 'EPSG:3857',
                    featureProjection: 'EPSG:3857',
                });
                if (olFeature?.getGeometry?.()) {
                    parsed.push({ olFeature, layerId: result.layerId });
                }
            } catch {
                // skip malformed feature
            }
        }
    }
    return parsed;
};

const computeFeaturesExtent = (parsedFeatures) => {
    if (!parsedFeatures?.length) return null;
    const extent = createEmpty();
    for (const { olFeature } of parsedFeatures) {
        const geom = olFeature.getGeometry();
        if (geom) extend(extent, geom.getExtent());
    }
    return isEmpty(extent) ? null : extent;
};

const getExtentCenter = (extent) => {
    if (!extent || extent.length !== 4) return null;
    const [minX, minY, maxX, maxY] = extent;
    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return null;
    return getCenter(extent);
};

export const centerOnResults = ({ activeMap, results, clickPosition }) => {
    if (!activeMap || !results?.length) return false;
    const parsed = parseResultsFeatures(results);
    const extent = computeFeaturesExtent(parsed);
    if (!extent) return false;
    const view = activeMap.getView();
    const width = extent[2] - extent[0];
    const height = extent[3] - extent[1];
    const center = getExtentCenter(extent);
    const isPointLike = width < 1 && height < 1;
    if (isPointLike && center) {
        const currentZoom = view.getZoom() ?? 12;
        view.animate({ center, zoom: Math.max(currentZoom, 15), duration: 400 });
    } else {
        view.fit(extent, { padding: [60, 60, 60, 60], duration: 400, maxZoom: 16 });
    }
    if (center) {
        setTimeout(() => {
            const pixel = activeMap.getPixelFromCoordinate(center);
            if (pixel) clickPosition?.updatePosition({ pixel });
        }, 420);
    }
    return true;
};

const coordenadaDePunto = (geometry) => {
    if (geometry?.type === 'Point') return geometry.coordinates;
    if (geometry?.type === 'MultiPoint' && geometry.coordinates?.length === 1) return geometry.coordinates[0];
    return null;
};

export const ubicacionDeFeature = (feature, lngLat = null) => {
    const punto = coordenadaDePunto(feature?.geometry);
    if (Array.isArray(punto) && punto.slice(0, 2).every(Number.isFinite)) {
        const [lng, lat] = toLonLat(punto);
        return { lat, lng };
    }
    return lngLat;
};
