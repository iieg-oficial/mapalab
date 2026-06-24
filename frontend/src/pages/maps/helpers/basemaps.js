import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';

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
    iieg: 'hillshade_iieg_cog',
    inegi: 'hillshade_inegi_cog',
};

export const RELIEF_OVERLAY_Z_INDEX = 10000;

const createReliefSource = (geoserverLayer) => new TileWMS({
    url: `${GEOSERVER_BASE}/${RELIEF_WORKSPACE}/wms`,
    params: {
        LAYERS: `${RELIEF_WORKSPACE}:${geoserverLayer}`,
        TILED: true,
        FORMAT: 'image/png',
        TRANSPARENT: true,
        VERSION: '1.1.0',
    },
    serverType: 'geoserver',
    crossOrigin: 'anonymous',
});

export const RELIEF_OVERLAY = {
    iieg: () => createReliefSource(RELIEF_LAYERS.iieg),
    inegi: () => createReliefSource(RELIEF_LAYERS.inegi),
};

const INEGI_LIMIT_LAYER_IDS = ['limite_inegi', 'limite_municipal_inegi'];

export const isInegiBaseMode = (activeLayerIds = []) =>
    activeLayerIds.some(id => INEGI_LIMIT_LAYER_IDS.includes(id));
