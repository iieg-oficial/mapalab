import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat, toLonLat } from 'ol/proj';
import { cellOf, cellRing, quantileBreaks, chooseBreakdownField, breakdownOf } from './h3Aggregation';
import { hexbinStyle, HEXBIN_CLASSES } from './hexbinStyles';
import { VECTOR_PROJECTION } from '@services/vectorLayerService';

export const HEXBIN_LAYER_FLAG = 'mapalabHexbin';

export const pointsFromFeatures = (features) => {
    const points = [];

    (features || []).forEach((feature) => {
        const geometry = feature.getGeometry?.();
        if (!geometry) return;

        const type = geometry.getType();
        if (type === 'Point') {
            points.push(toLonLat(geometry.getCoordinates(), VECTOR_PROJECTION));
            return;
        }
        if (type === 'MultiPoint') {
            geometry.getCoordinates().forEach(coord => {
                points.push(toLonLat(coord, VECTOR_PROJECTION));
            });
        }
    });

    return points;
};

export const buildHexbinFeatures = (features, resolution) => {
    const byCell = new Map();
    const breakdownField = chooseBreakdownField(features);

    (features || []).forEach((feature) => {
        pointsFromFeatures([feature]).forEach((lonLat) => {
            const cell = cellOf(lonLat, resolution);
            if (!cell) return;
            if (!byCell.has(cell)) byCell.set(cell, []);
            byCell.get(cell).push(feature);
        });
    });

    if (byCell.size === 0) return { features: [], breaks: [], max: 0, breakdownField: null };

    const values = Array.from(byCell.values(), members => members.length);
    const breaks = quantileBreaks(values, HEXBIN_CLASSES);
    const max = Math.max(...values);

    const hexes = Array.from(byCell.entries()).map(([cell, members]) => {
        const ring = cellRing(cell).map(([lon, lat]) => fromLonLat([lon, lat], VECTOR_PROJECTION));
        const feature = new Feature({ geometry: new Polygon([[...ring, ring[0]]]) });
        feature.set('h3Index', cell);
        feature.set('count', members.length);
        feature.set('breakdownField', breakdownField);
        feature.set('breakdown', breakdownOf(members, breakdownField));
        feature.set('members', members);
        return feature;
    });

    return { features: hexes, breaks, max, breakdownField };
};

export const createHexbinLayer = ({ layerId, zIndex, opacity }) => {
    const layer = new VectorLayer({
        source: new VectorSource(),
        zIndex,
        opacity,
        layerId,
        [HEXBIN_LAYER_FLAG]: true
    });

    layer.setStyle((feature) => hexbinStyle(
        feature.get('count'),
        layer.get('hexbinBreaks') || [],
        feature.get('h3Index') === layer.get('selectedCell')
    ));
    return layer;
};

export const fillHexbinLayer = (layer, features, resolution) => {
    const { features: hexes, breaks, max } = buildHexbinFeatures(features, resolution);
    layer.set('hexbinBreaks', breaks);
    layer.set('hexbinMax', max);
    const source = layer.getSource();
    source.clear(true);
    source.addFeatures(hexes);
    return { breaks, max, cells: hexes.length };
};
