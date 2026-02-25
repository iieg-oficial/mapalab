import XYZ from 'ol/source/XYZ';

export const BASEMAPS = {
    voyager: {
        id: 'carto_voyager',
        label: 'Mapa Carto Voyager',
        create: () =>
            new XYZ({
                url: 'https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
                attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: ['a', 'b', 'c', 'd'],
                crossOrigin: 'anonymous',
            }),
    },
    position: {
        id: 'carto_light',
        label: 'Carto Light',
        create: () =>
            new XYZ({
                url: 'https://basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
                attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
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
