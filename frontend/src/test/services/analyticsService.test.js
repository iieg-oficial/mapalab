import { describe, it, expect, beforeEach } from 'vitest';
import {
    trackLayerToggle,
    trackFeatureClick,
    trackMapZoomLevel,
    trackLayerSearch,
    trackLayerDetailOpen,
    trackLayerDownload,
    trackMapExport,
    trackRasterLoop,
    trackMeasurementTool,
    trackBasemapChange,
    trackGeolocate,
    trackPeriodicityAdvanced,
    trackSiderLock,
    trackShareMap
} from '@/services/analyticsService';

beforeEach(() => {
    window.dataLayer = [];
});

const getEvents = () => window.dataLayer;

describe('analyticsService', () => {
    describe('trackLayerToggle', () => {
        it('pushea layer_toggle con action activar', () => {
            trackLayerToggle('capa-1', true);
            expect(getEvents()).toContainEqual({ event: 'layer_toggle', layer_id: 'capa-1', action: 'activar' });
        });

        it('pushea layer_toggle con action desactivar', () => {
            trackLayerToggle('capa-1', false);
            expect(getEvents()).toContainEqual({ event: 'layer_toggle', layer_id: 'capa-1', action: 'desactivar' });
        });

        it('pushea map_interaction con el nombre del evento', () => {
            trackLayerToggle('capa-1', true);
            expect(getEvents()).toContainEqual({ event: 'map_interaction', action: 'layer_toggle' });
        });

        it('pushea exactamente 2 eventos', () => {
            trackLayerToggle('capa-1', true);
            expect(getEvents()).toHaveLength(2);
        });
    });

    describe('trackFeatureClick', () => {
        it('pushea feature_click con layer_id', () => {
            trackFeatureClick('mi-capa');
            expect(getEvents()).toContainEqual({ event: 'feature_click', layer_id: 'mi-capa' });
        });
    });

    describe('trackMapZoomLevel', () => {
        it('redondea el zoom hacia arriba', () => {
            trackMapZoomLevel(5.7);
            expect(getEvents()).toContainEqual({ event: 'map_zoom_level', zoom_level: 6 });
        });

        it('redondea el zoom hacia abajo', () => {
            trackMapZoomLevel(5.2);
            expect(getEvents()).toContainEqual({ event: 'map_zoom_level', zoom_level: 5 });
        });

        it('no modifica zoom entero', () => {
            trackMapZoomLevel(8);
            expect(getEvents()).toContainEqual({ event: 'map_zoom_level', zoom_level: 8 });
        });
    });

    describe('trackLayerSearch', () => {
        it('pushea layer_search con query', () => {
            trackLayerSearch('hospitales');
            expect(getEvents()).toContainEqual({ event: 'layer_search', query: 'hospitales' });
        });
    });

    describe('trackLayerDetailOpen', () => {
        it('pushea layer_detail_open con layer_id', () => {
            trackLayerDetailOpen('capa-detalle');
            expect(getEvents()).toContainEqual({ event: 'layer_detail_open', layer_id: 'capa-detalle' });
        });
    });

    describe('trackLayerDownload', () => {
        it('pushea layer_download con layer_id', () => {
            trackLayerDownload('capa-descarga');
            expect(getEvents()).toContainEqual({ event: 'layer_download', layer_id: 'capa-descarga' });
        });
    });

    describe('trackMapExport', () => {
        it('pushea map_export con format, quality y view', () => {
            trackMapExport('png', 'alta', 'completa');
            expect(getEvents()).toContainEqual({ event: 'map_export', format: 'png', quality: 'alta', view: 'completa' });
        });
    });

    describe('trackRasterLoop', () => {
        it('pushea raster_loop_start cuando isStarting es true', () => {
            trackRasterLoop('capa-raster', true);
            expect(getEvents()).toContainEqual({ event: 'raster_loop_start', layer_id: 'capa-raster' });
        });

        it('pushea raster_loop_stop cuando isStarting es false', () => {
            trackRasterLoop('capa-raster', false);
            expect(getEvents()).toContainEqual({ event: 'raster_loop_stop', layer_id: 'capa-raster' });
        });
    });

    describe('trackMeasurementTool', () => {
        it('pushea measurement_tool_use con tool', () => {
            trackMeasurementTool('polygon');
            expect(getEvents()).toContainEqual({ event: 'measurement_tool_use', tool: 'polygon' });
        });
    });

    describe('trackBasemapChange', () => {
        it('pushea basemap_change con basemap_id', () => {
            trackBasemapChange('osm');
            expect(getEvents()).toContainEqual({ event: 'basemap_change', basemap_id: 'osm' });
        });
    });

    describe('trackGeolocate', () => {
        it('pushea geolocate con status', () => {
            trackGeolocate('success');
            expect(getEvents()).toContainEqual({ event: 'geolocate', status: 'success' });
        });
    });

    describe('trackPeriodicityAdvanced', () => {
        it('pushea periodicity_advanced con layer_id', () => {
            trackPeriodicityAdvanced('capa-raster');
            expect(getEvents()).toContainEqual({ event: 'periodicity_advanced', layer_id: 'capa-raster' });
        });
    });

    describe('trackSiderLock', () => {
        it('pushea sider_lock con mode', () => {
            trackSiderLock('locked');
            expect(getEvents()).toContainEqual({ event: 'sider_lock', mode: 'locked' });
        });
    });

    describe('trackShareMap', () => {
        it('pushea share_map con status', () => {
            trackShareMap('copied');
            expect(getEvents()).toContainEqual({ event: 'share_map', status: 'copied' });
        });
    });
});
