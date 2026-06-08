import { Style, Stroke, Fill, Circle as CircleStyle, Icon as IconStyle, Text as TextStyle } from 'ol/style';
import { Point } from 'ol/geom';
import { DRAW_COLORS, DRAW_FILLS, DEFAULT_TEXT_FILL } from './drawingConstants';

const DEFAULT_STYLES = {
    LineString: {
        stroke: '#703089',
        fill: 'rgba(112, 48, 137, 0.2)'
    },
    Polygon: {
        stroke: '#f97316',
        fill: 'rgba(249, 115, 22, 0.2)'
    },
    Select: {
        stroke: '#8b5cf6',
        fill: 'rgba(139, 92, 246, 0.15)'
    },
    Point: {
        stroke: '#703089',
        fill: '#703089'
    }
};

const calculateAngle = (p1, p2, p3) => {
    const v1x = p1[0] - p2[0];
    const v1y = p1[1] - p2[1];
    const v2x = p3[0] - p2[0];
    const v2y = p3[1] - p2[1];

    const dot = v1x * v2x + v1y * v2y;
    const det = v1x * v2y - v1y * v2x;
    const angleRad = Math.atan2(det, dot);

    let angleDeg = Math.abs(angleRad * 180 / Math.PI);

    if (angleDeg > 180) {
        angleDeg = 360 - angleDeg;
    }

    return angleDeg;
};

const createAngleStyles = (coordinates, isClosed = false) => {
    const styles = [];
    const minAngle = 10;

    const coordsToProcess = isClosed
        ? [...coordinates, coordinates[0]]
        : coordinates;

    for (let i = 1; i < coordsToProcess.length - 1; i++) {
        const p1 = coordsToProcess[i - 1];
        const p2 = coordsToProcess[i];
        const p3 = coordsToProcess[i + 1];

        const angle = calculateAngle(p1, p2, p3);

        if (angle >= minAngle && angle < 180 - minAngle) {
            styles.push(new Style({
                geometry: new Point(p2),
                text: new TextStyle({
                    text: `${Math.round(angle)}°`,
                    font: '600 10px "Inter", sans-serif',
                    fill: new Fill({ color: '#4b5563' }),
                    stroke: new Stroke({ color: '#ffffff', width: 2 }),
                    offsetY: 8
                })
            }));
        }
    }

    return styles;
};

const createLabelStyle = (text, geometry) => {
    if (!text || !geometry) return null;

    const geometryType = geometry.getType();

    if (geometryType === 'Polygon') {
        return new Style({
            geometry: geometry.getInteriorPoint(),
            text: new TextStyle({
                text: text,
                font: '600 12px "Inter", sans-serif',
                fill: new Fill({ color: '#111827' }),
                stroke: new Stroke({ color: '#ffffff', width: 3 }),
                backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 0.9)' }),
                padding: [2, 4, 2, 4]
            })
        });
    } else if (geometryType === 'LineString') {
        const coordinates = geometry.getCoordinates();
        const lastCoord = coordinates[coordinates.length - 1];

        return new Style({
            geometry: new Point(lastCoord),
            text: new TextStyle({
                text: text,
                font: '600 12px "Inter", sans-serif',
                fill: new Fill({ color: '#111827' }),
                stroke: new Stroke({ color: '#ffffff', width: 3 }),
                offsetY: -10,
                backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 0.9)' }),
                padding: [2, 4, 2, 4]
            })
        });
    }

    return null;
};

const computeStylesForFeature = (geometryType, label, geometry, config = {}) => {
    const colors = DEFAULT_STYLES[geometryType] || DEFAULT_STYLES.Point;
    const baseStyle = new Style({
        fill: new Fill({ color: colors.fill }),
        stroke: new Stroke({ color: colors.stroke, width: 3 }),
        image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: colors.fill || colors.stroke }),
            stroke: new Stroke({ color: '#ffffff', width: 2 })
        })
    });

    const styles = [baseStyle];

    const showLabels = config.showMeasurementLabels !== false;
    const showAngles = config.showFinalAngles !== false;

    if (label && geometry && showLabels) {
        const labelStyle = createLabelStyle(label, geometry);
        if (labelStyle) {
            styles.push(labelStyle);
        }
    }

    if (geometry && (geometryType === 'LineString' || geometryType === 'Polygon') && showAngles) {
        const coordinates = geometryType === 'Polygon'
            ? geometry.getCoordinates()[0]
            : geometry.getCoordinates();

        const angleStyles = createAngleStyles(coordinates, geometryType === 'Polygon');
        styles.push(...angleStyles);
    }

    return styles.length === 1 ? baseStyle : styles;
};

export { computeStylesForFeature };

export const createDefaultStyle = (geometryType, label = null, geometry = null) => {
    return computeStylesForFeature(geometryType, label, geometry);
};

export const computeAndCacheStyle = (feature, measurementValue = null, config = {}) => {
    const geometry = feature.getGeometry();
    const geometryType = geometry?.getType();

    if (!geometryType) return null;

    const styles = computeStylesForFeature(geometryType, measurementValue, geometry, config);
    feature.set('cachedStyle', styles, true);

    return styles;
};

const createSelectionHalo = ({ radius = 22, scale = 1 } = {}) => (
    new Style({
        image: new CircleStyle({
            radius: radius * scale,
            fill: new Fill({ color: 'rgba(112, 48, 138, 0.18)' }),
            stroke: new Stroke({ color: '#70308A', width: 2 })
        })
    })
);

const TEXT_FONT = 'bold 16px "Garet", "Inter", sans-serif';
const TEXT_FONT_SIZE = 16;

const createRoundedTextBg = (text, rotation, scale) => new Style({
    renderer: (coords, state) => {
        const ctx = state.context;
        const pixelRatio = state.pixelRatio || 1;
        const [x, y] = coords;

        ctx.save();
        ctx.font = TEXT_FONT;
        ctx.textBaseline = 'alphabetic';

        const metrics = ctx.measureText(text || 'Texto');
        const width = metrics.width;
        const aAsc = metrics.actualBoundingBoxAscent ?? TEXT_FONT_SIZE * 0.75;
        const aDesc = metrics.actualBoundingBoxDescent ?? TEXT_FONT_SIZE * 0.2;
        const fAsc = metrics.fontBoundingBoxAscent ?? TEXT_FONT_SIZE * 0.8;
        const fDesc = metrics.fontBoundingBoxDescent ?? TEXT_FONT_SIZE * 0.2;

        const emMidToBaseline = (fAsc - fDesc) / 2;
        const visualCenterY = emMidToBaseline + (aDesc - aAsc) / 2;
        const visualH = aAsc + aDesc;

        const padX = 8;
        const padY = 4;
        const radius = 6;

        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale * pixelRatio, scale * pixelRatio);

        const w = width + padX * 2;
        const h = visualH + padY * 2;

        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(-w / 2, visualCenterY - h / 2, w, h, radius);
        } else {
            ctx.rect(-w / 2, visualCenterY - h / 2, w, h);
        }
        ctx.fillStyle = 'rgba(112, 48, 138, 0.18)';
        ctx.fill();
        ctx.strokeStyle = '#70308A';
        ctx.lineWidth = 2 / (scale * pixelRatio);
        ctx.stroke();
        ctx.restore();
    }
});

export const createTextStyle = (text, rotation = 0, scale = 1, selected = false, fillColor = '#111827', bgColor = '') => {
    const textOpts = {
        text: text || 'Texto',
        font: TEXT_FONT,
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({ color: '#ffffff', width: 3 }),
        textBaseline: 'middle',
        rotation,
        scale,
    };
    if (bgColor) {
        textOpts.backgroundFill = new Fill({ color: bgColor });
        textOpts.backgroundStroke = new Stroke({ color: bgColor, width: 1 });
        textOpts.padding = [2, 4, 2, 4];
    }
    const main = new Style({ text: new TextStyle(textOpts) });
    return selected ? [createRoundedTextBg(text || 'Texto', rotation, scale), main] : main;
};

const createEmojiStyle = (emoji, rotation = 0, scale = 1, selected = false, fillColor = '#111827', strokeColor = '#ffffff', fontFamily = null, backgroundFill = null, backgroundStroke = null) => {
    const font = fontFamily || '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji", sans-serif';
    const textOpts = {
        text: emoji || '🙂',
        font: `32px ${font}`,
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({ color: strokeColor, width: 2 }),
        textBaseline: 'middle',
        rotation,
        scale,
    };
    if (backgroundFill) {
        textOpts.backgroundFill = new Fill({ color: backgroundFill });
        textOpts.backgroundStroke = new Stroke({ color: backgroundStroke || backgroundFill, width: 1 });
        textOpts.padding = [2, 4, 2, 4];
    }
    const main = new Style({
        text: new TextStyle(textOpts)
    });
    return selected ? [createSelectionHalo({ radius: 22, scale }), main] : main;
};

export const svgToDataUrl = (xml) => `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;

export const createSymbolStyle = (symbol, rotation = 0, scale = 1, selected = false, fillColor = '#111827', strokeColor = '#ffffff', fontFamily = null, backgroundFill = null, backgroundStroke = null) => {
    if (!symbol) return createEmojiStyle('🙂', rotation, scale, selected, fillColor, strokeColor, fontFamily, backgroundFill, backgroundStroke);

    if (typeof symbol === 'string') {
        return createEmojiStyle(symbol, rotation, scale, selected, fillColor, strokeColor, fontFamily, backgroundFill, backgroundStroke);
    }

    if (symbol.kind === 'emoji') {
        return createEmojiStyle(symbol.value, rotation, scale, selected, fillColor, strokeColor, fontFamily, backgroundFill, backgroundStroke);
    }

    const src = symbol.kind === 'svg'
        ? svgToDataUrl(symbol.value || '')
        : (symbol.imageUrl || symbol.image_url || symbol.value);

    if (!src) return createEmojiStyle('🙂', rotation, scale, selected, fillColor, strokeColor, fontFamily, backgroundFill, backgroundStroke);

    const main = new Style({
        image: new IconStyle({
            src,
            rotation,
            scale,
            crossOrigin: 'anonymous',
        }),
    });
    return selected ? [createSelectionHalo({ radius: 22, scale }), main] : main;
};

export const createFreehandStyle = () => (
    new Style({
        stroke: new Stroke({
            color: '#ec4899',
            width: 3,
            lineCap: 'round',
            lineJoin: 'round'
        })
    })
);
