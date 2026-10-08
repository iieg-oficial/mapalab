import GeoJSON from 'ol/format/GeoJSON';
import { asString } from 'ol/color';
import { VECTOR_PROJECTION } from '@services/vectorLayerService';

const FALLBACK_COLOR = '#5C2472';
const format = new GeoJSON();
const WRITE_OPTIONS = { dataProjection: 'EPSG:4326', featureProjection: VECTOR_PROJECTION, decimals: 6 };

const cssColor = (color) => {
    if (Array.isArray(color)) return asString(color);
    return typeof color === 'string' ? color : null;
};

const firstStyle = (styleFunction, feature, resolution) => {
    const style = styleFunction ? styleFunction(feature, resolution) : null;
    return Array.isArray(style) ? style[0] || null : style;
};

const colorsOf = (style) => {
    const image = style?.getImage?.();
    const fill = cssColor(style?.getFill?.()?.getColor?.()) || cssColor(image?.getFill?.()?.getColor?.());
    const stroke = cssColor(style?.getStroke?.()?.getColor?.()) || cssColor(image?.getStroke?.()?.getColor?.());
    return { fill: fill || stroke || FALLBACK_COLOR, stroke: stroke || fill || FALLBACK_COLOR };
};

export const bakedCollection = (olLayer, resolution) => {
    const features = olLayer.getSource()?.getFeatures?.() || [];
    const styleFunction = olLayer.getStyleFunction?.();
    const collection = format.writeFeaturesObject(features, WRITE_OPTIONS);
    collection.features.forEach((feature, index) => {
        const { fill, stroke } = colorsOf(firstStyle(styleFunction, features[index], resolution));
        feature.properties = { ...(feature.properties || {}), _fill: fill, _stroke: stroke };
    });
    return collection;
};

export const toLonLatCollection = (json) => format.writeFeaturesObject(
    format.readFeatures(json, { dataProjection: VECTOR_PROJECTION, featureProjection: VECTOR_PROJECTION }),
    WRITE_OPTIONS,
);

export const geometryKind = (collection) => {
    const type = collection.features.find(feature => feature.geometry)?.geometry?.type || '';
    if (type.includes('Polygon')) return 'polygon';
    if (type.includes('LineString')) return 'line';
    return type.includes('Point') ? 'point' : null;
};
