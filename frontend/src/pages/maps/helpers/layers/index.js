export const layers = [];

export const replaceLayers = (newLayers) => {
    layers.length = 0;
    if (Array.isArray(newLayers)) {
        layers.push(...newLayers);
    }
};
