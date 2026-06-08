import { Style, Stroke, Fill, Text as TextStyle } from 'ol/style';
import { Point, LineString } from 'ol/geom';
import { getLength } from 'ol/sphere';
import { DRAW_COLORS, DRAW_FILLS } from './drawingConstants';
import { formatLengthValue } from './formatMeasure';

const LABEL_FONT = '"Garet", "Inter", sans-serif';

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

export const createAngleStyles = (coordinates, isClosed = false) => {
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
                    font: `600 10px ${LABEL_FONT}`,
                    fill: new Fill({ color: DRAW_COLORS.graphite }),
                    stroke: new Stroke({ color: DRAW_COLORS.white, width: 2 }),
                    offsetY: 8
                })
            }));
        }
    }

    return styles;
};

export const createSegmentLengthStyles = (coordinates, { lengthUnit = 'auto', isClosed = false } = {}) => {
    const styles = [];
    const coordsToProcess = isClosed
        ? [...coordinates, coordinates[0]]
        : coordinates;

    for (let i = 0; i < coordsToProcess.length - 1; i++) {
        const p1 = coordsToProcess[i];
        const p2 = coordsToProcess[i + 1];
        const midpoint = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
        const segment = new LineString([p1, p2]);
        const length = getLength(segment);
        const text = formatLengthValue(length, lengthUnit);

        styles.push(new Style({
            geometry: new Point(midpoint),
            text: new TextStyle({
                text,
                font: `600 10px ${LABEL_FONT}`,
                fill: new Fill({ color: DRAW_COLORS.graphite }),
                stroke: new Stroke({ color: DRAW_COLORS.white, width: 2 }),
                offsetY: -8
            })
        }));
    }
    return styles;
};
