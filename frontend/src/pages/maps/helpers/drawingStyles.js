import { Style, Stroke, Fill, Circle as CircleStyle, Icon as IconStyle, Text as TextStyle } from 'ol/style';
import { Point } from 'ol/geom';
import { getLength } from 'ol/sphere';
import { DRAW_COLORS, DRAW_FILLS, DEFAULT_TEXT_FILL } from './drawingConstants';
import { formatLengthValue } from './formatMeasure';
import { createAngleStyles, createSegmentLengthStyles } from './measurementStyles';

const LABEL_FONT = '"Garet", "Inter", sans-serif';

const ETIQUETA_MEDICION = Symbol('etiquetaDeMedicion');

const marcarEtiqueta = (estilo) => {
    estilo[ETIQUETA_MEDICION] = true;
    return estilo;
};

export const sinEtiquetasDeMedicion = (estilos) => {
    if (!estilos) return estilos;
    const lista = Array.isArray(estilos) ? estilos : [estilos];
    const visibles = lista.filter(estilo => !estilo?.[ETIQUETA_MEDICION]);
    return visibles.length === lista.length ? estilos : visibles;
};

const DEFAULT_STYLES = {
    LineString: {
        stroke: DRAW_COLORS.purpleDeep,
        fill: DRAW_FILLS.purpleDeep
    },
    Polygon: {
        stroke: DRAW_COLORS.orange,
        fill: DRAW_FILLS.orange
    },
    Select: {
        stroke: DRAW_COLORS.numeralia,
        fill: DRAW_FILLS.numeralia
    },
    Point: {
        stroke: DRAW_COLORS.purpleDeep,
        fill: DRAW_COLORS.purpleDeep
    }
};

const createLabelStyle = (text, geometry) => {
    if (!text || !geometry) return null;

    const geometryType = geometry.getType();

    if (geometryType === 'Polygon') {
        return marcarEtiqueta(new Style({
            geometry: geometry.getInteriorPoint(),
            text: new TextStyle({
                text: text,
                font: `600 12px ${LABEL_FONT}`,
                fill: new Fill({ color: DEFAULT_TEXT_FILL }),
                stroke: new Stroke({ color: DRAW_COLORS.white, width: 3 }),
                backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 0.9)' }),
                padding: [2, 4, 2, 4]
            })
        }));
    } else if (geometryType === 'LineString') {
        const coordinates = geometry.getCoordinates();
        const lastCoord = coordinates[coordinates.length - 1];

        return marcarEtiqueta(new Style({
            geometry: new Point(lastCoord),
            text: new TextStyle({
                text: text,
                font: `600 12px ${LABEL_FONT}`,
                fill: new Fill({ color: DEFAULT_TEXT_FILL }),
                stroke: new Stroke({ color: DRAW_COLORS.white, width: 3 }),
                offsetY: -10,
                backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 0.9)' }),
                padding: [2, 4, 2, 4]
            })
        }));
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
        let labelText = label;
        if (geometryType === 'Polygon') {
            const perimeter = getLength(geometry);
            const perimeterText = formatLengthValue(perimeter, config.lengthUnit || 'auto');
            labelText = `${label}\nPerímetro: ${perimeterText}`;
        }
        const labelStyle = createLabelStyle(labelText, geometry);
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

    if (geometry && (geometryType === 'LineString' || geometryType === 'Polygon') && config.showSegmentLengths) {
        const coordinates = geometryType === 'Polygon'
            ? geometry.getCoordinates()[0]
            : geometry.getCoordinates();
        const segmentStyles = createSegmentLengthStyles(coordinates, {
            lengthUnit: config.lengthUnit || 'auto',
            isClosed: geometryType === 'Polygon'
        });
        styles.push(...segmentStyles);
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
            fill: new Fill({ color: DRAW_FILLS.halo }),
            stroke: new Stroke({ color: DRAW_COLORS.purpleDeep, width: 2 })
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
        ctx.fillStyle = DRAW_FILLS.halo;
        ctx.fill();
        ctx.strokeStyle = DRAW_COLORS.purpleDeep;
        ctx.lineWidth = 2 / (scale * pixelRatio);
        ctx.stroke();
        ctx.restore();
    }
});

export const createTextStyle = (text, rotation = 0, scale = 1, selected = false, fillColor = DEFAULT_TEXT_FILL, bgColor = '') => {
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

const createEmojiStyle = (emoji, rotation = 0, scale = 1, selected = false, fillColor = DEFAULT_TEXT_FILL, strokeColor = '#ffffff', fontFamily = null, backgroundFill = null, backgroundStroke = null) => {
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

export const createFreehandStyle = (color = DRAW_COLORS.pink, width = 3, selected = false) => {
    const main = new Style({
        stroke: new Stroke({
            color: color || DRAW_COLORS.pink,
            width: width || 3,
            lineCap: 'round',
            lineJoin: 'round'
        })
    });
    if (!selected) return main;
    const halo = new Style({
        stroke: new Stroke({
            color: DRAW_FILLS.halo,
            width: (width || 3) + 8,
            lineCap: 'round',
            lineJoin: 'round'
        })
    });
    return [halo, main];
};
