export const layers = [];
export const initialOrder = [];

export const replaceLayers = (newLayers) => {
    layers.length = 0;
    if (Array.isArray(newLayers)) {
        layers.push(...newLayers);
    }
};

export const replaceInitialOrder = (newOrder) => {
    initialOrder.length = 0;
    if (Array.isArray(newOrder)) {
        initialOrder.push(...newOrder);
    }
};

export { findLayerById } from './utils/layerHelpers';
