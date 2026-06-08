import GeoJSON from 'ol/format/GeoJSON';
import { createFreehandStyle, createSymbolStyle, createTextStyle, computeAndCacheStyle } from './drawingStyles';
import { DEFAULT_TEXT_FILL, DEFAULT_TEXT_BG, DRAW_COLORS } from './drawingConstants';
import { genId } from './genId';

const RESTORE_GEOJSON = new GeoJSON({
    featureProjection: 'EPSG:3857',
    dataProjection: 'EPSG:4326',
});

const centerOf = (geometry) => {
    const extent = geometry.getExtent();
    return [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
};

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
        const rotation = typeof item.rotation === 'number' ? item.rotation : 0;
        const scale = typeof item.size === 'number' && item.size > 0 ? item.size : 1;
        let value = item.value;
        let label = item.label;
        let extra = {};

        feature.set('annotationType', type);
        feature.set('visible', item.visible !== false, true);
        feature.set('rotation', rotation);
        feature.set('scale', scale);

        if (type === 'LineString') {
            value = formatLength(geom);
            if (!label) label = `Distancia: ${value}`;
            computeAndCacheStyle(feature, value, measurementConfig);
        } else if (type === 'Polygon') {
            value = formatArea(geom);
            if (!label) label = `Área: ${value}`;
            const center = centerOf(geom);
            feature.set('selectionGeometry', geom);
            feature.set('selectionCenter', center);
            extra = { geometry: geom, center };
            computeAndCacheStyle(feature, value, measurementConfig);
        } else if (type === 'Text') {
            const textLabel = item.textLabel || '';
            const fillColor = item.fillColor || DEFAULT_TEXT_FILL;
            const bgColor = item.bgColor || DEFAULT_TEXT_BG;
            feature.set('textLabel', textLabel);
            feature.set('fillColor', fillColor);
            feature.set('bgColor', bgColor);
            value = textLabel;
            if (!label) label = `Texto: ${textLabel || 'Sin contenido'}`;
            feature.set('cachedStyle', createTextStyle(textLabel, rotation, scale, false, fillColor, bgColor), true);
        } else if (type === 'Emoji') {
            const symbol = item.symbol || { kind: 'emoji', value: item.textLabel || '' };
            const labelText = symbol.kind === 'emoji' ? symbol.value : (symbol.name || item.textLabel || '');
            feature.set('symbolPayload', symbol);
            feature.set('textLabel', item.textLabel || labelText);
            value = labelText;
            if (!label) label = `Emoji: ${labelText || ''}`;
            feature.set('cachedStyle', createSymbolStyle(symbol, rotation, scale, false), true);
        } else if (type === 'Freehand') {
            if (!label) label = 'Trazo libre';
            const strokeColor = item.strokeColor || DRAW_COLORS.pink;
            const strokeWidth = item.strokeWidth || 3;
            feature.set('strokeColor', strokeColor);
            feature.set('strokeWidth', strokeWidth);
            feature.set('cachedStyle', createFreehandStyle(strokeColor, strokeWidth), true);
        }

        feature.set('measurementValue', value ?? null);
        source.addFeature(feature);
        items.push({
            id: item.id || genId(),
            type,
            feature,
            visible: item.visible !== false,
            label: label || '',
            value: value ?? null,
            ...extra,
        });
    });
    return items;
};
