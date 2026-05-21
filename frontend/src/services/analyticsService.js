import { debugStore } from './analyticsDebugStore';
import { enqueue as telemetryEnqueue } from './telemetryService';

const isDev = import.meta.env.VITE_NODE_ENV === 'development';

const trackEvent = (eventName, params = {}) => {
    window.dataLayer?.push({ event: eventName, ...params });
    if (isDev) debugStore.emit({ event: eventName, params, time: new Date() });
    telemetryEnqueue(eventName, params);
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

export const trackMeasurementTool = (tool) =>
    withMapInteraction('measurement_tool_use', { tool });

export const trackMeasurementPanelOpen = () =>
    trackEvent('tools_panel_open', {});

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

export const trackEventoOpen = (eventoId, titulo) =>
    withMapInteraction('evento_open', { evento_id: eventoId, titulo });

export const trackEventoClose = (eventoId) =>
    withMapInteraction('evento_close', { evento_id: eventoId });

export const trackEventoShare = (eventoId, status) =>
    withMapInteraction('evento_share', { evento_id: eventoId, status });

export const trackEventoReport = (eventoId) =>
    withMapInteraction('evento_report', { evento_id: eventoId });

export const trackThemeChange = (theme) =>
    withMapInteraction('theme_change', { theme });

export const trackOpacityChange = (layerId, value) =>
    withMapInteraction('opacity_change', { layer_id: layerId, value: Math.round((value ?? 1) * 100) });

export const trackLegendsToggle = (visible) =>
    withMapInteraction('legends_toggle', { visible: !!visible });

export const trackSwipeEnter = (orientation) =>
    withMapInteraction('swipe_enter', { orientation });

export const trackSwipeExit = (durationSec) =>
    withMapInteraction('swipe_exit', { duration_sec: durationSec });

export const trackSwipeSlotChange = (layerId, from, to) =>
    withMapInteraction('swipe_slot_change', { layer_id: layerId, from, to });

export const trackInfoBoxAction = (action, layerId) =>
    withMapInteraction('infobox_action', { action, layer_id: layerId });

export const trackHomeAction = (action, section) =>
    withMapInteraction('home_action', { action, section });

export const trackLogoClick = (logo) =>
    trackEvent('logo_click', { logo });

export const trackLayerReorder = (layerId, from, to) =>
    withMapInteraction('layer_reorder', { layer_id: layerId, from, to });

export const trackLayerNoticeView = ({ layerId, variant, position, hasCta }) =>
    trackEvent('layer_notice_view', { layer_id: layerId, variant, position, has_cta: !!hasCta });

export const trackLayerNoticeDismiss = ({ layerId, variant }) =>
    withMapInteraction('layer_notice_dismiss', { layer_id: layerId, variant });

export const trackLayerNoticeCtaClick = ({ layerId, variant, url }) =>
    withMapInteraction('layer_notice_cta_click', { layer_id: layerId, variant, url });
