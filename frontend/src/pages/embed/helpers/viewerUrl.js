export const buildViewerUrl = ({ share, layers, center, marker, zoom }) => {
    const path = window.location.pathname.replace(/\/embed\/?$/, '/mapa');
    const qs = new URLSearchParams();
    if (share) {
        qs.set('s', share);
    } else {
        if (layers?.length) qs.set('layers', layers.join(','));
        if (center) qs.set('center', center.join(','));
        if (marker) qs.set('marker', marker.join(','));
    }
    if (zoom) qs.set('zoom', String(zoom));
    const search = qs.toString();
    return search ? `${path}?${search}` : path;
};
