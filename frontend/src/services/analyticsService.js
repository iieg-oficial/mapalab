import { debugStore } from './analyticsDebugStore';

const isDev = import.meta.env.VITE_NODE_ENV === 'development';

const trackEvent = (eventName, params = {}) => {
    window.dataLayer?.push({ event: eventName, ...params });
    if (isDev) debugStore.emit({ event: eventName, params, time: new Date() });
};

const withMapInteraction = (eventName, params) => {
    trackEvent(eventName, params);
    trackEvent('map_interaction', { action: eventName });
};

export const trackLayerToggle = (layerId, isActivating) =>
    withMapInteraction('layer_toggle', { layer_id: layerId, action: isActivating ? 'activar' : 'desactivar' });

export const trackFeatureClick = (layerId) =>
    withMapInteraction('feature_click', { layer_id: layerId });

export const trackMapZoomLevel = (zoomLevel) =>
    withMapInteraction('map_zoom_level', { zoom_level: Math.round(zoomLevel) });

export const trackLayerSearch = (query) =>
    withMapInteraction('layer_search', { query });

export const trackLayerDetailOpen = (layerId) =>
    withMapInteraction('layer_detail_open', { layer_id: layerId });

export const trackLayerDownload = (layerId) =>
    withMapInteraction('layer_download', { layer_id: layerId });

export const trackMapExport = (format, quality, view) =>
    withMapInteraction('map_export', { format, quality, view });

export const trackRasterLoop = (layerId, isStarting) =>
    withMapInteraction(isStarting ? 'raster_loop_start' : 'raster_loop_stop', { layer_id: layerId });

export const trackDrawingTool = (tool) =>
    withMapInteraction('drawing_tool_use', { tool });

export const trackBasemapChange = (basemapId) =>
    withMapInteraction('basemap_change', { basemap_id: basemapId });

export const trackGeolocate = (status) =>
    withMapInteraction('geolocate', { status });

export const trackPeriodicityAdvanced = (layerId) =>
    withMapInteraction('periodicity_advanced', { layer_id: layerId });

export const trackSiderLock = (mode) =>
    withMapInteraction('sider_lock', { mode });

export const trackShareMap = (status) =>
    withMapInteraction('share_map', { status });

export const trackInfoOpen = () =>
    withMapInteraction('info_open', {});

export const trackReportSubmitted = (tipo, sourceRoute) =>
    trackEvent('report_submitted', { tipo, source_route: sourceRoute });

export const trackEventoOpen = (eventoId, titulo) =>
    withMapInteraction('evento_open', { evento_id: eventoId, titulo });

export const trackEventoClose = (eventoId) =>
    withMapInteraction('evento_close', { evento_id: eventoId });
