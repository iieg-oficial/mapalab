import { fromLonLat } from 'ol/proj';

const isMobileViewport = () => window.innerWidth < 768;

export const getDefaultMapView = () => {
    const mobile = isMobileViewport();
    return {
        center: fromLonLat(mobile ? [-103.6, 20.6] : [-103.8, 20.85]),
        zoom: mobile ? 7 : 8.3
    };
};

export const getMinZoom = () => (isMobileViewport() ? 7 : 8);
