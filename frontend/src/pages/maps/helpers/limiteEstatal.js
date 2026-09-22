import { fetchVectorFeatures } from '@services/vectorLayerService';
import { toLonLatCollection } from './olToGeojson';

const GEOSERVER_BASE = (import.meta.env.VITE_GEOSERVER_URL || '').replace(/\/+$/, '');
const LIMITE_CONFIG = {
    baseUrl: `${GEOSERVER_BASE}/general/wms`,
    layerName: 'general:limite_estatal',
    wfsLayerName: 'general:limite_estatal',
};

export const outerRings = (collection) => (collection?.features || []).flatMap((feature) => {
    const { type, coordinates } = feature.geometry || {};
    if (type === 'Polygon') return [coordinates[0]];
    if (type === 'MultiPolygon') return coordinates.map(polygon => polygon[0]);
    return [];
});

export const buildContorno = (collection) => {
    const rings = outerRings(collection);
    if (rings.length === 0) return null;
    return {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: rings } }],
    };
};

let pending = null;

export const loadLimiteEstatal = () => {
    if (!pending) {
        pending = fetchVectorFeatures(LIMITE_CONFIG, null)
            .then(json => buildContorno(toLonLatCollection(json)))
            .catch((error) => {
                pending = null;
                throw error;
            });
    }
    return pending;
};
