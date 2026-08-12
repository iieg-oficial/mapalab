import { Style, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import { DRAW_COLORS } from './drawingConstants';

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const DEFAULT_COLOR = DRAW_COLORS.purpleDeep;

const styleCache = new Map();

const expandHex = (hex) => {
    if (hex.length !== 4) return hex;
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
};

const withAlpha = (hex, alpha) => {
    const full = expandHex(hex);
    const r = Number.parseInt(full.slice(1, 3), 16);
    const g = Number.parseInt(full.slice(3, 5), 16);
    const b = Number.parseInt(full.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const resolveVectorColor = (layerDef) => {
    const color = layerDef?.highlightColor;
    return HEX_PATTERN.test(color || '') ? color : DEFAULT_COLOR;
};

const buildStyle = (geometryType, color) => {
    if (geometryType === 'point') {
        return new Style({
            image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color }),
                stroke: new Stroke({ color: DRAW_COLORS.white, width: 1.5 })
            })
        });
    }

    if (geometryType === 'line') {
        return new Style({
            stroke: new Stroke({ color, width: 2.5 })
        });
    }

    return new Style({
        stroke: new Stroke({ color, width: 2 }),
        fill: new Fill({ color: withAlpha(color, 0.25) })
    });
};

export const createVectorLayerStyle = (geometryType, color) => {
    const key = `${geometryType}|${color}`;
    if (!styleCache.has(key)) {
        styleCache.set(key, buildStyle(geometryType, color));
    }
    return styleCache.get(key);
};
