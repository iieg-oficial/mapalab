import GeoJSON from 'ol/format/GeoJSON';
import { createFreehandStyle, createSymbolStyle, computeAndCacheStyle } from './drawingStyles';

const RESTORE_GEOJSON = new GeoJSON({
    featureProjection: 'EPSG:3857',
    dataProjection: 'EPSG:4326',
});

export const buildRestoredItems = ({ annotations, source, measurementConfig, formatLength, formatArea }) => {
    if (!Array.isArray(annotations) || annotations.length === 0 || !source) return [];
    const items = [];
    annotations.forEach((item) => {
        let feature;
        try {
            feature = RESTORE_GEOJSON.readFeature({ type: 'Feature', geometry: item.geometry, properties: {} });
        } catch {
            return;
        }
        const type = item.type;
        const geom = feature.getGeometry();
        let value = item.value;
        let label = item.label;
        if (type === 'LineString') {
            value = formatLength(geom);
            if (!label) label = `Distancia: ${value}`;
        } else if (type === 'Polygon') {
            value = formatArea(geom);
            if (!label) label = `Área: ${value}`;
        } else if (type === 'Text' || type === 'Emoji') {
            if (item.textLabel) feature.set('textLabel', item.textLabel);
            feature.set('annotationType', type);
            if (typeof item.rotation === 'number') feature.set('rotation', item.rotation);
            if (!label) label = item.textLabel || '';
        } else if (type === 'Freehand') {
            feature.set('annotationType', 'Freehand');
        }
        feature.set('measurementValue', value ?? null);
        if (type === 'Text' || type === 'Emoji') {
            feature.setStyle(createSymbolStyle(feature.get('textLabel') || '', feature.get('rotation') || 0, type));
        } else if (type === 'Freehand') {
            feature.setStyle(createFreehandStyle());
        } else {
            computeAndCacheStyle(feature, value, measurementConfig);
        }
        source.addFeature(feature);
        items.push({
            id: item.id || crypto.randomUUID(),
            type,
            feature,
            visible: item.visible !== false,
            label: label || '',
            value: value ?? null,
        });
    });
    return items;
};
