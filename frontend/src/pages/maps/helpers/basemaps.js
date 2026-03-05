import XYZ from 'ol/source/XYZ';

const CARTO_ATTRIBUTIONS = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const BASEMAPS = {
    voyager: {
        id: 'carto_voyager',
        label: 'Mapa Carto Voyager',
        labelZoomThreshold: 15,
        create: (withLabels = false) =>
            new XYZ({
                url: withLabels
                    ? 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                    : 'https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
                attributions: CARTO_ATTRIBUTIONS,
                subdomains: ['a', 'b', 'c', 'd'],
                crossOrigin: 'anonymous',
            }),
    },
    position: {
        id: 'carto_light',
        label: 'Carto Light',
        labelZoomThreshold: 15,
        create: (withLabels = false) =>
            new XYZ({
                url: withLabels
                    ? 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                    : 'https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
                attributions: CARTO_ATTRIBUTIONS,
                subdomains: ['a', 'b', 'c', 'd'],
                crossOrigin: 'anonymous',
            }),
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
