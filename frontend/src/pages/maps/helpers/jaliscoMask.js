import { fetchVectorFeatures } from '@services/vectorLayerService';
import { toLonLatCollection } from './olToGeojson';

const GEOSERVER_BASE = (import.meta.env.VITE_GEOSERVER_URL || '').replace(/\/+$/, '');
const LIMITE_CONFIG = {
    baseUrl: `${GEOSERVER_BASE}/general/wms`,
    layerName: 'general:limite_estatal',
    wfsLayerName: 'general:limite_estatal',
};
const WORLD_RING = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];

export const outerRings = (collection) => (collection?.features || []).flatMap((feature) => {
    const { type, coordinates } = feature.geometry || {};
    if (type === 'Polygon') return [coordinates[0]];
    if (type === 'MultiPolygon') return coordinates.map(polygon => polygon[0]);
    return [];
});

export const buildMask = (collection) => {
    const rings = outerRings(collection);
    if (rings.length === 0) return null;
    return {
        type: 'FeatureCollection',
        features: [
            { type: 'Feature', properties: { rol: 'mascara' }, geometry: { type: 'Polygon', coordinates: [WORLD_RING, ...rings] } },
            { type: 'Feature', properties: { rol: 'contorno' }, geometry: { type: 'MultiLineString', coordinates: rings } },
        ],
    };
};

let pending = null;

export const loadJaliscoMask = () => {
    if (!pending) {
        pending = fetchVectorFeatures(LIMITE_CONFIG, null)
            .then(json => buildMask(toLonLatCollection(json)))
            .catch((error) => {
                pending = null;
                throw error;
            });
    }
    return pending;
};
