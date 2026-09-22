import { hexbinRamp } from './hexbinStyles';

const NUMBER = String.raw`'?(-?\d+(?:\.\d+)?)'?`;
const LOWER = new RegExp(String.raw`([A-Za-z_][\w]*)\s*(>=|>)\s*${NUMBER}`);
const UPPER = new RegExp(String.raw`([A-Za-z_][\w]*)\s*(<=|<)\s*${NUMBER}`);
const IS_NULL = /([A-Za-z_][\w]*)\s+IS\s+NULL/i;

const symbolizerFill = (rule) => {
    for (const symbolizer of rule?.symbolizers || []) {
        const fill = symbolizer?.Polygon?.fill;
        if (fill) return fill;
    }
    return null;
};

const parseRule = (rule) => {
    const filter = String(rule?.filter || '');
    const color = symbolizerFill(rule);
    if (!color) return null;
    const nullMatch = filter.match(IS_NULL);
    if (nullMatch) return { property: nullMatch[1], isNull: true, color };
    const lower = filter.match(LOWER);
    const upper = filter.match(UPPER);
    if (!lower && !upper) return null;
    return {
        property: (lower || upper)[1],
        min: lower ? Number(lower[3]) : -Infinity,
        max: upper ? Number(upper[3]) : Infinity,
        color,
    };
};

export const parseLegendRules = (legendJson) => {
    const rules = legendJson?.Legend?.[0]?.rules;
    if (!Array.isArray(rules) || rules.length === 0) return null;
    const parsed = rules.map(parseRule);
    if (parsed.some(rule => rule === null)) return null;
    const ranges = parsed.filter(rule => !rule.isNull).sort((a, b) => a.min - b.min);
    if (ranges.length === 0) return null;
    const property = ranges[0].property;
    if (parsed.some(rule => rule.property !== property)) return null;
    const nullRule = parsed.find(rule => rule.isNull);
    return {
        property,
        classes: ranges.map(({ min, max, color }) => ({ min, max, color })),
        nullColor: nullRule ? nullRule.color : null,
    };
};

export const quantileClasses = (values, ramp = hexbinRamp()) => {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (sorted.length === 0) return [];
    const cuts = ramp.map((_, i) => sorted[Math.floor((i / ramp.length) * (sorted.length - 1))]);
    const classes = [];
    cuts.forEach((min, i) => {
        if (i > 0 && min === cuts[i - 1]) return;
        classes.push({ min, max: Infinity, color: ramp[i] });
    });
    return classes.map((cls, i) => ({ ...cls, max: classes[i + 1]?.min ?? Infinity }));
};

export const colorExpression = (property, classes, fallback = '#cccccc') => {
    if (!classes.length) return fallback;
    const value = ['to-number', ['get', property], Number.NaN];
    const step = ['step', value, classes[0].color];
    classes.slice(1).forEach(cls => { step.push(cls.min, cls.color); });
    return ['case', ['==', ['typeof', ['get', property]], 'null'], fallback, step];
};

export const heightExpression = (property, maxValue, maxHeightMeters) => {
    if (!(maxValue > 0)) return 0;
    const ratio = maxHeightMeters / maxValue;
    return ['*', ['max', 0, ['to-number', ['get', property], 0]], ratio];
};

const ID_LIKE = /^(fid|id|gid|objectid|cve_|clave|clave_|codigo|cvegeo|anio|año|fecha|year)/i;

export const numericProperties = (features) => {
    const counts = new Map();
    for (const feature of features.slice(0, 200)) {
        for (const [key, value] of Object.entries(feature?.properties || {})) {
            if (ID_LIKE.test(key)) continue;
            const number = typeof value === 'number' ? value : Number(value);
            if (value !== null && value !== '' && Number.isFinite(number)) counts.set(key, (counts.get(key) || 0) + 1);
        }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([key]) => key);
};
