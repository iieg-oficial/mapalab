import { getLength, getArea } from 'ol/sphere';
import { LineString } from 'ol/geom';
import { formatNumber } from './formatNumber';

export const formatLength = (geometry, unit = 'auto') => {
    const meters = getLength(geometry);
    return formatLengthValue(meters, unit);
};

export const formatLengthValue = (meters, unit = 'auto') => {
    if (unit === 'm') return `${formatNumber(Math.round(meters * 100) / 100)} m`;
    if (unit === 'km') return `${formatNumber(Math.round((meters / 1000) * 100) / 100)} km`;
    if (meters > 1000) {
        return `${formatNumber(Math.round((meters / 1000) * 100) / 100)} km`;
    }
    return `${formatNumber(Math.round(meters * 100) / 100)} m`;
};

export const formatArea = (geometry, unit = 'auto') => {
    const m2 = getArea(geometry);
    return formatAreaValue(m2, unit);
};

export const formatAreaValue = (m2, unit = 'auto') => {
    if (unit === 'm2') return `${formatNumber(Math.round(m2 * 100) / 100)} m²`;
    if (unit === 'ha') return `${formatNumber(Math.round((m2 / 10000) * 100) / 100)} ha`;
    if (unit === 'km2') return `${formatNumber(Math.round((m2 / 1000000) * 100) / 100)} km²`;
    if (m2 > 10000) {
        return `${formatNumber(Math.round((m2 / 1000000) * 100) / 100)} km²`;
    }
    return `${formatNumber(Math.round(m2 * 100) / 100)} m²`;
};

export const getSegmentLengths = (coordinates) => {
    const lengths = [];
    for (let i = 0; i < coordinates.length - 1; i++) {
        const segment = new LineString([coordinates[i], coordinates[i + 1]]);
        lengths.push(getLength(segment));
    }
    return lengths;
};
