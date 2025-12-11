import { Style, Stroke, Fill, Circle as CircleStyle, Text as TextStyle } from 'ol/style';
import { Point } from 'ol/geom';

const DEFAULT_STYLES = {
    LineString: {
        stroke: '#3b82f6',
        fill: 'rgba(59, 130, 246, 0.2)'
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
        stroke: '#3b82f6',
        fill: '#3b82f6'
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

export const createTextStyle = (text, rotation = 0) => (
    new Style({
        text: new TextStyle({
            text: text || 'Texto',
            font: '600 16px "Inter", sans-serif',
            fill: new Fill({ color: '#111827' }),
            stroke: new Stroke({ color: '#ffffff', width: 3 }),
            offsetY: -4,
            rotation
        })
    })
);

export const createEmojiStyle = (emoji, rotation = 0) => (
    new Style({
        text: new TextStyle({
            text: emoji || '🙂',
            font: '32px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji", sans-serif',
            fill: new Fill({ color: '#111827' }),
            stroke: new Stroke({ color: '#ffffff', width: 2 }),
            offsetY: -6,
            rotation
        })
    })
);

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
