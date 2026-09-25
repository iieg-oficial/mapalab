import { toLonLat, fromLonLat } from 'ol/proj';
import { canUseVectorService, SERVICE_HEXBIN } from './serviceMode';
import { JALISCO_BOUNDS } from './wmsConfig';

export const VIEW3D_DEFAULTS = {
    pitch: 55, bearing: 0, exaggeration: 1.5, sol: 315, alturaColumnas: 1, terreno: true, cielo: true, niebla: true,
};
export const VIEW3D_COLUMN_RANGE = [0.5, 3];
export const CIELO_SPEC = {
    'sky-color': '#a7c4e0',
    'horizon-color': '#e7e2d8',
    'fog-color': '#e9e6df',
    'fog-ground-blend': 0.6,
    'horizon-fog-blend': 0.5,
    'sky-horizon-blend': 0.6,
    'atmosphere-blend': 0.7,
};
export const cieloSpec = ({ cielo, niebla }) => ({
    ...CIELO_SPEC,
    ...(cielo ? {} : { 'sky-color': '#ffffff', 'horizon-color': '#ffffff', 'atmosphere-blend': 0 }),
    ...(niebla ? {} : { 'fog-ground-blend': 1, 'horizon-fog-blend': 0 }),
});
export const VIEW3D_PITCH_MAX = 80;
export const VIEW3D_EXAGGERATION_RANGE = [1, 5];
export const EXTRUSION_MAX_HEIGHT_M = 45000;
const TERRAIN_LAYER = 'raster:elevacion_terreno_rgb';
const RELIEF_DEM_LAYER = 'raster:elevacion_jalisco_rgb';
const TERRAIN_MAX_ZOOM = 12;
const TERRAIN_BOUNDS = [-107.56, 17.14, -99.69, 24.45];
const TERRAIN_REVISION = 'contexto-2';

const GEOSERVER_BASE = (import.meta.env.VITE_GEOSERVER_URL || '').replace(/\/+$/, '');
const MAPLIBRE_ZOOM_OFFSET = 1;

const absolute = (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
};

const clamp = (value, [min, max]) => Math.min(max, Math.max(min, value));

export const clampPitch = (pitch) => clamp(Number(pitch) || 0, [0, VIEW3D_PITCH_MAX]);
export const clampExaggeration = (value) => clamp(Number(value) || 1, VIEW3D_EXAGGERATION_RANGE);
export const clampColumnas = (value) => clamp(Number(value) || 1, VIEW3D_COLUMN_RANGE);
export const clampSol = (value) => ((Math.round(Number(value) || 0) % 360) + 360) % 360;

const RUMBOS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
export const rumboDeAngulo = (grados) => RUMBOS[Math.round(clampSol(grados) / 45) % 8];

export const olViewToCamera = (view) => {
    const center = view?.getCenter?.();
    if (!center) return { center: JALISCO_BOUNDS.center, zoom: JALISCO_BOUNDS.zoom - MAPLIBRE_ZOOM_OFFSET };
    return {
        center: toLonLat(center),
        zoom: (view.getZoom() ?? JALISCO_BOUNDS.zoom) - MAPLIBRE_ZOOM_OFFSET,
    };
};

export const cameraToOlView = ({ center, zoom }) => ({
    center: fromLonLat(center),
    zoom: zoom + MAPLIBRE_ZOOM_OFFSET,
});

const wmtsTileUrl = (layer) => {
    const params = new URLSearchParams({
        SERVICE: 'WMTS',
        REQUEST: 'GetTile',
        VERSION: '1.0.0',
        LAYER: layer,
        STYLE: '',
        TILEMATRIXSET: 'EPSG:900913',
        FORMAT: 'image/png',
    });
    return `${absolute(`${GEOSERVER_BASE}/gwc/service/wmts`)}?${params.toString()}&TILEMATRIX=EPSG:900913:{z}&TILEROW={y}&TILECOL={x}`;
};

const demSourceSpec = (tile, bounds) => ({
    type: 'raster-dem',
    tiles: [tile],
    tileSize: 256,
    maxzoom: TERRAIN_MAX_ZOOM,
    bounds,
    encoding: 'custom',
    redFactor: 256,
    greenFactor: 1,
    blueFactor: 0,
    baseShift: 0,
});

export const terrainSourceSpec = () => demSourceSpec(`${wmtsTileUrl(TERRAIN_LAYER)}&dem=${TERRAIN_REVISION}`, TERRAIN_BOUNDS);

export const reliefSourceSpec = () => demSourceSpec(wmtsTileUrl(RELIEF_DEM_LAYER), JALISCO_BOUNDS.coords);

export const basemapTileUrl = (template) => (template ? absolute(template.replace('{r}', '')) : null);

export const RELIEF_LAYER_ID = 'sombreado';

const rasterSource = (template) => ({ type: 'raster', tiles: [basemapTileUrl(template)], tileSize: 256 });

export const basemapSources = (basemap) => ({
    ...(basemap?.tiles ? { base: rasterSource(basemap.tiles) } : {}),
    ...(basemap?.labelsTiles ? { etiquetas: rasterSource(basemap.labelsTiles) } : {}),
});

export const basemapLayers = (basemap) => [
    ...(basemap?.tiles ? [{ id: 'base', type: 'raster', source: 'base' }] : []),
    ...(basemap?.labelsTiles ? [{ id: 'etiquetas', type: 'raster', source: 'etiquetas', minzoom: 14 }] : []),
];

export const buildBaseStyle = (basemap) => ({
    version: 8,
    sources: { terreno: terrainSourceSpec(), sombreado: reliefSourceSpec(), ...basemapSources(basemap) },
    layers: [
        { id: 'fondo', type: 'background', paint: { 'background-color': '#ffffff' } },
        ...basemapLayers(basemap).filter(layer => layer.id === 'base'),
        {
            id: RELIEF_LAYER_ID,
            type: 'hillshade',
            source: 'sombreado',
            paint: {
                'hillshade-exaggeration': 0.45,
                'hillshade-shadow-color': '#3d3833',
                'hillshade-highlight-color': 'rgba(255, 255, 255, 0.2)',
                'hillshade-accent-color': '#5a5048',
            },
        },
        ...basemapLayers(basemap).filter(layer => layer.id === 'etiquetas'),
    ],
});

const SKIPPED_WMS_PARAMS = new Set(['WIDTH', 'HEIGHT', 'BBOX', 'SRS', 'CRS', 'REQUEST', 'SERVICE', 'TILED']);

export const wmsTileUrl = (url, params, tamano = 256) => {
    if (!url) return null;
    const query = new URLSearchParams({ SERVICE: 'WMS', REQUEST: 'GetMap', SRS: 'EPSG:3857', WIDTH: String(tamano), HEIGHT: String(tamano) });
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || SKIPPED_WMS_PARAMS.has(key.toUpperCase())) return;
        query.set(key, String(value));
    });
    if (!query.has('VERSION')) query.set('VERSION', '1.1.1');
    const version = query.get('VERSION');
    if (version === '1.3.0') {
        query.delete('SRS');
        query.set('CRS', 'EPSG:3857');
    }
    return `${absolute(url)}?${query.toString()}&BBOX={bbox-epsg-3857}`;
};

export const canExtrudeLayer = (layerDef, serviceMode) => {
    if (serviceMode === SERVICE_HEXBIN) return true;
    return canUseVectorService(layerDef) && layerDef.geometryType === 'polygon';
};

export const cqlSegmentFor = (params, layerName) => {
    const names = String(params?.LAYERS || '').split(',');
    const filters = String(params?.CQL_FILTER || '').split(';');
    const index = names.indexOf(layerName);
    if (index < 0 || !params?.CQL_FILTER) return null;
    const segment = (filters[index] ?? filters[0] ?? '').trim();
    return segment && segment.toUpperCase() !== 'INCLUDE' ? segment : null;
};

export const webglAvailable = () => {
    try {
        const canvas = document.createElement('canvas');
        return !!canvas.getContext('webgl2');
    } catch {
        return false;
    }
};
