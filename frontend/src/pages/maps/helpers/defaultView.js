import { fromLonLat } from 'ol/proj';

const isMobileViewport = () => window.innerWidth < 768;

export const getDefaultMapView = () => {
    const mobile = isMobileViewport();
    return {
        center: fromLonLat(mobile ? [-103.6, 20.6] : [-103.8, 20.85]),
        zoom: mobile ? 7 : 8.3
    };
};

export const parseLatLng = (raw) => {
    if (!raw) return null;
    const parts = String(raw).split(',').map((n) => Number(n.trim()));
    if (parts.length !== 2 || !parts.every((n) => Number.isFinite(n))) return null;
    const [lat, lng] = parts;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return [lat, lng];
};

export const getMinZoom = () => (isMobileViewport() ? 7 : 8);

export const ZOOM_ANIMATION_MS = 0;
