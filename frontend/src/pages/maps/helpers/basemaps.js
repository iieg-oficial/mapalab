import XYZ from 'ol/source/XYZ';

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
