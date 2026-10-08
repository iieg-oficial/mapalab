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

const FALLBACK_CATEGORICAL = ['#5C2472', '#D55E00', '#0072B2', '#117733', '#CC79A7'];

let cachedRamp = null;
let cachedCategorical = null;
const rampCache = new Map();

const expandHex = (hex) => {
    const valor = String(hex || '').trim();
    if (valor.length !== 4 || !/^#[0-9a-f]{3}$/i.test(valor)) return valor;
    return `#${valor[1]}${valor[1]}${valor[2]}${valor[2]}${valor[3]}${valor[3]}`;
};

const readToken = (name, fallback) => {
    if (typeof window === 'undefined' || !document?.documentElement) return expandHex(fallback);
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return expandHex(value || fallback);
};

export const hexbinRamp = () => {
    if (!cachedRamp) {
        cachedRamp = FALLBACK_RAMP.map((fallback, index) => readToken(`--color-viz-seq-${index + 1}`, fallback));
    }
    return cachedRamp;
};

const categoricalPalette = () => {
    if (!cachedCategorical) {
        cachedCategorical = FALLBACK_CATEGORICAL.map((fallback, index) => readToken(`--color-viz-cat-${index + 1}`, fallback));
    }
    return cachedCategorical;
};

export const baseColorFor = (paletteIndex) => {
    const paleta = categoricalPalette();
    return paleta[((paletteIndex || 0) % paleta.length + paleta.length) % paleta.length];
};

const mezclar = (color, factor) => {
    const hex = expandHex(color);
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    const hacia = (canal) => Math.round(canal + (255 - canal) * factor);
    return `#${[hacia(r), hacia(g), hacia(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
};

export const menorTonoLibre = (usados) => {
    const ocupados = usados instanceof Set ? usados : new Set(usados || []);
    let libre = 0;
    while (ocupados.has(libre)) libre += 1;
    return libre;
};

export const rampFor = (paletteIndex) => {
    const base = baseColorFor(paletteIndex);
    if (!rampCache.has(base)) {
        const pasos = [0.78, 0.58, 0.36, 0.16, 0];
        rampCache.set(base, pasos.map(factor => mezclar(base, factor)));
    }
    return rampCache.get(base);
};

const FILL_ALPHA = 0.75;

const OUTLINE_ALPHA = 0.45;
const OUTLINE_WIDTH = 0.9;

const styleCache = new Map();

const withAlpha = (color, alpha) => {
    const hex = expandHex(color);
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const hexbinColor = (count, breaks, paletteIndex) => {
    const ramp = paletteIndex == null ? hexbinRamp() : rampFor(paletteIndex);
    return ramp[classOf(count, breaks)] || ramp[0];
};

const SELECTED_STROKE = '#FF8300';

export const hexbinStyle = (count, breaks, opciones = {}) => {
    const { selectedCell = false, paletteIndex = 0, relleno = true } = opciones;
    const index = classOf(count, breaks);
    const key = `${paletteIndex}|${index}|${relleno ? 'f' : 'o'}|${selectedCell ? 's' : ''}`;

    if (!styleCache.has(key)) {
        const color = hexbinColor(count, breaks, paletteIndex);
        styleCache.set(key, new Style({
            fill: relleno ? new Fill({ color: withAlpha(color, FILL_ALPHA) }) : null,
            stroke: selectedCell
                ? new Stroke({ color: SELECTED_STROKE, width: 3 })
                : new Stroke({
                    color: relleno
                        ? 'rgba(255, 255, 255, 0.55)'
                        : withAlpha(baseColorFor(paletteIndex), OUTLINE_ALPHA),
                    width: relleno ? 1 : OUTLINE_WIDTH
                })
        }));
    }
    return styleCache.get(key);
};

export const legendEntries = (breaks, max, paletteIndex = null) => {
    if (max == null) return [];
    const ramp = paletteIndex == null ? hexbinRamp() : rampFor(paletteIndex);

    const bounds = [...breaks, max];
    let lower = 1;

    return bounds.map((upper, index) => {
        const entry = {
            color: ramp[index] || ramp[0],
            from: lower,
            to: upper
        };
        lower = upper + 1;
        return entry;
    }).filter(entry => entry.to >= entry.from);
};
