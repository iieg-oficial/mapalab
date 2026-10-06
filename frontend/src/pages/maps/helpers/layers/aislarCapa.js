import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import { findLayerById, collectLayersWithWMS } from '@pages/maps/helpers/layers/utils/layerHelpers';

export const OVERLAY_Z_INDEX = 1_000_000;

export const collectWMSNodes = (layerId, allLayers) => {
    const node = findLayerById(layerId, allLayers);
    if (!node) return [];
    return node.wmsConfig ? [node] : collectLayersWithWMS(node);
};

export const classifyLayer = (olLayer, targetIdSet) => {
    const mergedLayers = olLayer.get('mergedLayers');

    if (Array.isArray(mergedLayers)) {
        const targetIdxs = [];
        mergedLayers.forEach((entry, i) => {
            if ((entry.subLayers || []).some(sub => targetIdSet.has(sub.id))) targetIdxs.push(i);
        });
        if (targetIdxs.length === 0) return { role: 'other' };
        if (targetIdxs.length === mergedLayers.length) return { role: 'target' };
        return { role: 'mixed', targetIdxs };
    }

    const memberIds = olLayer.get('memberIds');
    if (Array.isArray(memberIds) && memberIds.some(id => targetIdSet.has(id))) return { role: 'target' };

    const layerId = olLayer.get('layerId');
    if (layerId) return targetIdSet.has(layerId) ? { role: 'target' } : { role: 'other' };

    return { role: 'skip' };
};

export const buildTargetOverlay = (hostLayer, targetIdxs) => {
    const source = hostLayer.getSource?.();
    const mergedLayers = hostLayer.get('mergedLayers');
    if (!source || !Array.isArray(mergedLayers)) return null;

    const params = source.getParams ? source.getParams() : null;
    const url = source.getUrl ? source.getUrl() : null;
    if (!params || !url) return null;

    const split = (value, sep) => (value == null ? null : String(value).split(sep));
    const layersArr = split(params.LAYERS, ',');
    if (!layersArr || layersArr.length !== mergedLayers.length) return null;

    const pick = (arr) => (arr && arr.length === mergedLayers.length ? targetIdxs.map(i => arr[i]) : null);

    const overlayParams = { ...params, LAYERS: pick(layersArr).join(',') };
    const styles = pick(split(params.STYLES, ','));
    if (styles) overlayParams.STYLES = styles.join(',');
    const cql = pick(split(params.CQL_FILTER, ';'));
    if (cql) overlayParams.CQL_FILTER = cql.join(';');

    const overlaySource = new ImageWMS({
        url,
        params: overlayParams,
        ratio: 1.5,
        serverType: 'geoserver',
        crossOrigin: 'anonymous',
    });

    return new ImageLayer({ source: overlaySource, opacity: 1, zIndex: OVERLAY_Z_INDEX });
};

export const resolveTargetIds = (layerId, allLayers) => {
    const nodes = collectWMSNodes(layerId, allLayers);
    return nodes.length ? new Set([layerId, ...nodes.map(n => n.id)]) : new Set();
};
