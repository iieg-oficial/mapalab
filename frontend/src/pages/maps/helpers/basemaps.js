import XYZ from 'ol/source/XYZ';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { get as getProjection, transformExtent } from 'ol/proj';
import { getTopLeft, getWidth } from 'ol/extent';

const CARTO_ATTRIBUTIONS = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const cartoSource = (path) => new XYZ({
    url: `https://basemaps.cartocdn.com/${path}/{z}/{x}/{y}{r}.png`,
    attributions: CARTO_ATTRIBUTIONS,
    subdomains: ['a', 'b', 'c', 'd'],
    crossOrigin: 'anonymous',
});

export const BASEMAPS = {
    voyager: {
        id: 'carto_voyager',
        label: 'Mapa Carto Voyager',
        labelZoomThreshold: 15,
        create: () => cartoSource('rastertiles/voyager_nolabels'),
        createLabelsOverlay: () => cartoSource('rastertiles/voyager_only_labels'),
    },
    position: {
        id: 'carto_light',
        label: 'Carto Light',
        labelZoomThreshold: 15,
        create: () => cartoSource('light_nolabels'),
        createLabelsOverlay: () => cartoSource('light_only_labels'),
    },
    sin_mapalab: {
        id: 'sin_mapalab',
        label: 'Sin Mapa Base',
        create: () => null,
    }
};

export const BASEMAP_ORDER = [
    'voyager',
    'position',
    'sin_mapalab'
];

const GEOSERVER_BASE = (import.meta.env.VITE_GEOSERVER_URL || '').replace(/\/+$/, '');

const RELIEF_WORKSPACE = 'raster';

const RELIEF_LAYERS = {
    iieg: {
        name: 'hillshade_iieg_cog',
        bounds: [-105.70670965387814, 18.93184629415408, -101.44269122765184, 22.749048964466933],
    },
    inegi: {
        name: 'hillshade_inegi_cog',
        bounds: [-105.70673474114572, 18.903431233975432, -101.48746658563687, 22.75392720802865],
    },
};

export const RELIEF_OVERLAY_Z_INDEX = 10000;

const RELIEF_MATRIX_SET = 'EPSG:900913';
const RELIEF_MATRIX_LEVELS = 31;
const RELIEF_TILE_SIZE = 256;

const reliefProjection = getProjection('EPSG:3857');

const createReliefTileGrid = (bounds) => {
    const worldExtent = reliefProjection.getExtent();
    const maxResolution = getWidth(worldExtent) / RELIEF_TILE_SIZE;
    const resolutions = [];
    const matrixIds = [];

    for (let z = 0; z < RELIEF_MATRIX_LEVELS; z += 1) {
        resolutions.push(maxResolution / 2 ** z);
        matrixIds.push(`${RELIEF_MATRIX_SET}:${z}`);
    }

    return new WMTSTileGrid({
        origin: getTopLeft(worldExtent),
        extent: transformExtent(bounds, 'EPSG:4326', reliefProjection),
        resolutions,
        matrixIds,
    });
};

const createReliefSource = ({ name, bounds }) => new WMTS({
    url: `${GEOSERVER_BASE}/gwc/service/wmts`,
    layer: `${RELIEF_WORKSPACE}:${name}`,
    matrixSet: RELIEF_MATRIX_SET,
    format: 'image/png',
    projection: reliefProjection,
    tileGrid: createReliefTileGrid(bounds),
    style: '',
    requestEncoding: 'KVP',
    crossOrigin: 'anonymous',
});

export const RELIEF_OVERLAY = {
    iieg: () => createReliefSource(RELIEF_LAYERS.iieg),
    inegi: () => createReliefSource(RELIEF_LAYERS.inegi),
};

const INEGI_LIMIT_LAYER_IDS = ['limite_inegi', 'limite_municipal_inegi'];

export const isInegiBaseMode = (activeLayerIds = []) =>
    activeLayerIds.some(id => INEGI_LIMIT_LAYER_IDS.includes(id));
