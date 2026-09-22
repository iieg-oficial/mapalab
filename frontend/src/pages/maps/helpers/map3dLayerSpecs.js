import { EXTRUSION_MAX_HEIGHT_M } from './view3d';
import { heightExpression } from './extrusionRules';

const EXTRUSION_OPACITY = 0.92;

const extrusionPaint = ({ property, maxValue, color, escala = 1 }) => ({
    'fill-extrusion-color': color,
    'fill-extrusion-height': heightExpression(property, maxValue, EXTRUSION_MAX_HEIGHT_M * escala),
    'fill-extrusion-base': 0,
    'fill-extrusion-opacity': EXTRUSION_OPACITY,
});

export const EXTRUSION_PROPERTY_KEY = 'mapalab:property';

export const extrusionLayer = (id, source, style, escala = 1) => ({
    id,
    type: 'fill-extrusion',
    source,
    metadata: { [EXTRUSION_PROPERTY_KEY]: style.property },
    paint: extrusionPaint({ ...style, escala }),
});

export const vectorLayerSpecs = (id, kind, { opacity = 1, extrusion = null, escala = 1 } = {}) => {
    if (kind === 'polygon' && extrusion) {
        return [extrusionLayer(`${id}-ext`, id, extrusion, escala)];
    }
    if (kind === 'polygon') {
        return [
            { id: `${id}-fill`, type: 'fill', source: id, paint: { 'fill-color': ['get', '_fill'], 'fill-opacity': opacity } },
            { id: `${id}-line`, type: 'line', source: id, paint: { 'line-color': ['get', '_stroke'], 'line-width': 0.6, 'line-opacity': opacity } },
        ];
    }
    if (kind === 'line') {
        return [{ id: `${id}-line`, type: 'line', source: id, paint: { 'line-color': ['get', '_stroke'], 'line-width': 1.5, 'line-opacity': opacity } }];
    }
    if (kind === 'point') {
        return [{
            id: `${id}-circle`,
            type: 'circle',
            source: id,
            paint: {
                'circle-color': ['get', '_fill'],
                'circle-radius': 4,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 1,
                'circle-opacity': opacity,
            },
        }];
    }
    return [];
};

const layersWithPrefix = (map, id) => (map.getStyle()?.layers || [])
    .map(layer => layer.id)
    .filter(layerId => layerId.startsWith(`${id}-`));

export const upsertGeojson = (map, id, data) => {
    const source = map.getSource(id);
    if (source) source.setData(data);
    else map.addSource(id, { type: 'geojson', data });
};

export const replaceLayers = (map, id, specs, beforeId) => {
    layersWithPrefix(map, id).forEach(layerId => map.removeLayer(layerId));
    const before = beforeId && map.getLayer(beforeId) ? beforeId : undefined;
    specs.forEach(spec => map.addLayer(spec, spec.type === 'fill-extrusion' ? undefined : before));
};

export const removeGeojson = (map, id) => {
    layersWithPrefix(map, id).forEach(layerId => map.removeLayer(layerId));
    if (map.getSource(id)) map.removeSource(id);
};

export const managedIds = (map, prefix) => Object.keys(map.getStyle()?.sources || {}).filter(id => id.startsWith(prefix));

export const maxOf = (features, property) => features.reduce((max, feature) => {
    const value = Number(feature.properties?.[property]);
    return Number.isFinite(value) && value > max ? value : max;
}, 0);
