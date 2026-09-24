import GeoJSON from 'ol/format/GeoJSON';

const ANNOTATION_GEOJSON = new GeoJSON({
    featureProjection: 'EPSG:3857',
    dataProjection: 'EPSG:4326',
});

const ANNOTATION_TYPES = new Set(['LineString', 'Polygon', 'Select', 'Freehand', 'Text', 'Emoji', 'Pin']);

export const serializeAnnotations = (measurements) => {
    if (!Array.isArray(measurements) || measurements.length === 0) return null;
    const out = [];
    measurements.forEach((m) => {
        if (!m?.feature || !ANNOTATION_TYPES.has(m.type)) return;
        let geometry;
        try {
            geometry = ANNOTATION_GEOJSON.writeGeometryObject(m.feature.getGeometry());
        } catch {
            return;
        }
        const feature = m.feature;
        const entry = {
            id: m.id,
            type: m.type,
            geometry,
            visible: m.visible !== false,
        };
        if (m.label) entry.label = m.label;
        if (m.value !== undefined && m.value !== null) entry.value = m.value;

        const textLabel = feature.get('textLabel');
        if (textLabel) entry.textLabel = textLabel;
        const rotation = feature.get('rotation');
        if (typeof rotation === 'number' && rotation !== 0) entry.rotation = rotation;
        const scale = feature.get('scale');
        if (typeof scale === 'number' && scale !== 1) entry.size = scale;

        if (m.type === 'Text') {
            const fillColor = feature.get('fillColor');
            if (fillColor) entry.fillColor = fillColor;
            const bgColor = feature.get('bgColor');
            if (bgColor) entry.bgColor = bgColor;
        }
        if (m.type === 'Emoji') {
            const symbol = feature.get('symbolPayload');
            if (symbol) entry.symbol = symbol;
        }
        if (m.type === 'Pin') {
            const pinEtiqueta = feature.get('pinEtiqueta');
            if (pinEtiqueta) entry.pinEtiqueta = pinEtiqueta;
        }
        if (m.type === 'Freehand') {
            const strokeColor = feature.get('strokeColor');
            if (strokeColor) entry.strokeColor = strokeColor;
            const strokeWidth = feature.get('strokeWidth');
            if (strokeWidth) entry.strokeWidth = strokeWidth;
        }

        out.push(entry);
    });
    return out.length > 0 ? out : null;
};
