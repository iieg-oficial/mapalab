import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import GeoJSON from 'ol/format/GeoJSON';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';
import { hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';

export const HIGHLIGHT_Z = 998;

export const geojson = new GeoJSON();

export const HIGHLIGHT_STYLE = new Style({
    stroke: new Stroke({ color: '#FF8300', width: 2.5, lineCap: 'round', lineJoin: 'round' }),
    fill: new Fill({ color: 'rgba(255, 131, 0, 0.18)' }),
    image: new CircleStyle({
        radius: 8,
        stroke: new Stroke({ color: '#FF8300', width: 2 }),
        fill: new Fill({ color: 'rgba(255, 131, 0, 0.18)' }),
    }),
});

export const buildWmsLayer = (capa) => {
    const render = {};
    const format = capa.imageFormat || capa.image_format;
    if (format) render.format = format;
    if (capa.antialias) render.antialias = capa.antialias;
    const cfg = hydrateWmsConfig({
        geoserverWorkspace: capa.geoserverWorkspace,
        geoserverLayer: capa.geoserverLayer,
        ...render,
    });
    if (!cfg) return null;
    const params = {
        LAYERS: cfg.layerName,
        FORMAT: cfg.format,
        TRANSPARENT: cfg.transparent,
        VERSION: cfg.version,
    };
    if (cfg.antialias && cfg.antialias !== 'full') {
        params.format_options = `antialias:${cfg.antialias}`;
    }
    const source = new ImageWMS({
        url: cfg.baseUrl,
        params,
        ratio: 1,
        serverType: 'geoserver',
        crossOrigin: 'anonymous',
    });
    return new ImageLayer({ source, zIndex: 5 });
};
