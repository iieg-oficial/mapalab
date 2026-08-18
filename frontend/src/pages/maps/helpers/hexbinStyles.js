import { Style, Stroke, Fill } from 'ol/style';
import { classOf } from './h3Aggregation';

export const HEXBIN_CLASSES = 5;

const FALLBACK_RAMP = [
    '#E6D3EF',
    '#C9A5DC',
    '#A66FC0',
    '#8039A0',
    '#5C2472'
];

let cachedRamp = null;

const readToken = (name, fallback) => {
    if (typeof window === 'undefined' || !document?.documentElement) return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
};

export const hexbinRamp = () => {
    if (!cachedRamp) {
        cachedRamp = FALLBACK_RAMP.map((fallback, index) => readToken(`--color-viz-seq-${index + 1}`, fallback));
    }
    return cachedRamp;
};

export const clearRampCache = () => { cachedRamp = null; };

const FILL_ALPHA = 0.75;

const styleCache = new Map();

const withAlpha = (hex, alpha) => {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const hexbinColor = (count, breaks) => {
    const ramp = hexbinRamp();
    return ramp[classOf(count, breaks)] || ramp[0];
};

export const SELECTED_STROKE = '#FF8300';

export const hexbinStyle = (count, breaks, isSelected = false) => {
    const index = classOf(count, breaks);
    const key = isSelected ? `sel-${index}` : `${index}`;

    if (!styleCache.has(key)) {
        styleCache.set(key, new Style({
            fill: new Fill({ color: withAlpha(hexbinColor(count, breaks), FILL_ALPHA) }),
            stroke: isSelected
                ? new Stroke({ color: SELECTED_STROKE, width: 3 })
                : new Stroke({ color: 'rgba(255, 255, 255, 0.55)', width: 1 })
        }));
    }
    return styleCache.get(key);
};

export const legendEntries = (breaks, max) => {
    if (max == null) return [];

    const bounds = [...breaks, max];
    let lower = 1;

    return bounds.map((upper, index) => {
        const entry = {
            color: hexbinRamp()[index] || hexbinRamp()[0],
            from: lower,
            to: upper
        };
        lower = upper + 1;
        return entry;
    }).filter(entry => entry.to >= entry.from);
};
