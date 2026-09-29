import { debugStore } from './analyticsDebugStore';
import { devToolsStore } from './devToolsStore';
import { enqueue as telemetryEnqueue } from './telemetryService';


const trackEvent = (eventName, params = {}) => {
    window.dataLayer?.push({ event: eventName, ...params });
    if (devToolsStore.isToggleAvailable()) debugStore.emit({ event: eventName, params, time: new Date() });
    telemetryEnqueue(eventName, params);
};

const withMapInteraction = (eventName, params) => {
    trackEvent(eventName, params);
    trackEvent('map_interaction', { action: eventName });
};

export const trackLayerToggle = (layerId, isActivating, context) =>
    withMapInteraction('layer_toggle', { layer_id: layerId, action: isActivating ? 'activar' : 'desactivar', ...(context || {}) });

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

export const trackEventoOpen = (eventoId, titulo) =>
    withMapInteraction('evento_open', { evento_id: eventoId, titulo });

export const trackEventoClose = (eventoId) =>
    withMapInteraction('evento_close', { evento_id: eventoId });

export const trackEventoCenter = (eventoId) =>
    withMapInteraction('evento_center', { evento_id: eventoId });

export const trackEventoFunFact = (eventoId, detalle) =>
    withMapInteraction('evento_fun_fact', { evento_id: eventoId, ...(detalle || {}) });

export const trackEventoFunVolver = (eventoId) =>
    withMapInteraction('evento_fun_volver', { evento_id: eventoId });

export const trackEventoShare = (eventoId, status) =>
    withMapInteraction('evento_share', { evento_id: eventoId, status });

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

export const trackView3d = (action, params) =>
    withMapInteraction('view3d', { action, ...(params || {}) });

export const trackNorthReset = (modo) =>
    withMapInteraction('north_reset', { modo });

export const trackTablaOpen = (layerId) =>
    withMapInteraction('tabla_open', { layer_id: layerId });

export const trackTablaFilter = (layerId, action, columna) =>
    withMapInteraction('tabla_filter', { layer_id: layerId, action, columna });

export const trackTablaDownload = (layerId, format) =>
    withMapInteraction('tabla_download', { layer_id: layerId, format });

export const trackStatsOpen = (modo) =>
    withMapInteraction('stats_open', { modo });

export const trackStatsCustomCreate = (layerId, operation, filtros) =>
    withMapInteraction('stats_custom_create', { layer_id: layerId, operation, filtros });

export const trackStatsDetach = (layerId) =>
    withMapInteraction('stats_detach', { layer_id: layerId });

export const trackColibriOpen = (motivo, tipo) =>
    trackEvent('colibri_open', { motivo, tipo });

export const trackMinimapa = (accion) =>
    trackEvent('map_interaction', { action: `minimapa_${accion}` });

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

export const trackMunicipioModeEnter = ({ source, count, fromUrl = false }) =>
    withMapInteraction('municipio_mode_enter', { source, count, from_url: !!fromUrl });

export const trackMunicipioModeExit = ({ durationSec, source }) =>
    withMapInteraction('municipio_mode_exit', { duration_sec: durationSec, source });

export const trackMunicipioSelectionChange = ({ source, count, action }) =>
    withMapInteraction('municipio_mode_change', { source, count, action });

export const trackMunicipioPanelOpen = ({ source, active }) =>
    trackEvent('municipio_panel_open', { source, active: !!active });

export const trackCatalogoOpen = ({ from, slug = null }) =>
    trackEvent('catalogo_open', { from, slug });

export const trackCatalogoSearch = ({ query, results }) =>
    trackEvent('catalogo_search', { query, results });

export const trackCatalogoLayerSelect = ({ slug, fromSearch }) =>
    trackEvent('catalogo_layer_select', { slug, from_search: !!fromSearch });

export const trackCatalogoLayerClose = (slug) =>
    trackEvent('catalogo_layer_close', { slug });

export const trackCatalogoDownload = ({ slug, format }) =>
    trackEvent('catalogo_download', { slug, format });

export const trackCatalogoFeatureClick = ({ slug, count }) =>
    trackEvent('catalogo_feature_click', { slug, count });

export const trackCatalogoToolsToggle = (open) =>
    trackEvent('catalogo_tools_toggle', { open: !!open });

export const trackCatalogoInfoOpen = () =>
    trackEvent('catalogo_info_open', {});

export const trackCatalogoBack = (target) =>
    trackEvent('catalogo_back', { target });

export const trackCatalogoSlugNotFound = (slug) =>
    trackEvent('catalogo_slug_not_found', { slug });

export const trackCatalogoShare = ({ scope, slug, type }) =>
    trackEvent('catalogo_share', { scope, slug, type });

export const trackCatalogoInstitucionSelect = ({ slug, capas }) =>
    trackEvent('catalogo_institucion_select', { slug, capas });

export const trackCatalogoInfoBoxAction = ({ action, slug }) =>
    trackEvent('catalogo_infobox_action', { action, slug });

export const trackCatalogoInfoboxEditorOpen = (slug) =>
    trackEvent('catalogo_infobox_editor_open', { slug });

export const trackCatalogoInfoboxPropuesta = ({ slug, campos }) =>
    trackEvent('catalogo_infobox_propuesta', { slug, campos });
