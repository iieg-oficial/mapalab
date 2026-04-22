export const findLayerById = (layerId, layersArray) => {
    for (const layer of layersArray) {
        if (layer.id === layerId) {
            return layer;
        }
        if (layer.children) {
            const found = findLayerById(layerId, layer.children);
            if (found) return found;
        }
    }
    return null;
};

export const validateLayer = (layer) => {
    const requiredFields = ['id', 'label'];
    return requiredFields.every(field => field in layer);
};

export const getSymbologyStats = (layersArray) => {
    const stats = {
        total: 0,
        withSymbology: 0,
        withoutSymbology: 0,
        withErrors: 0,
        fallbackSymbology: 0
    };

    const traverse = (layers) => {
        for (const layer of layers) {
            if (layer.wmsConfig) {
                stats.total++;
                
                if (layer.symbology) {
                    stats.withSymbology++;
                    
                    if (layer.symbologyError) {
                        stats.withErrors++;
                    }
                    
                    if (layer.symbology.some(symbol => symbol.isFallback)) {
                        stats.fallbackSymbology++;
                    }
                } else {
                    stats.withoutSymbology++;
                }
            }
            
            if (layer.children) {
                traverse(layer.children);
            }
        }
    };

    traverse(layersArray);
    return stats;
};

export const collectLayersWithWMS = (layer) => {
    if (!layer) return [];

    const result = [];

    const traverse = (node) => {
        if (!node) return;

        if (node.wmsConfig) {
            result.push(node);
        }

        if (node.children && node.children.length > 0) {
            node.children.forEach(traverse);
        }
    };

    traverse(layer);
    return result;
};

export const collectLayerIdsWithWMS = (layer) =>
    collectLayersWithWMS(layer).map(node => node.id);

export const getAllChildLayerIds = (layerId, layersArray) => {
    const result = [];

    const collectIds = (layers) => {
        for (const layer of layers) {
            result.push(layer.id);
            if (layer.children && layer.children.length > 0) {
                collectIds(layer.children);
            }
        }
    };

    const layer = findLayerById(layerId, layersArray);
    if (layer && layer.children && layer.children.length > 0) {
        collectIds(layer.children);
    }

    return result;
};

export const findParentGroup = (layerId, layersArray) => {
    const findParent = (layers, parent = null) => {
        for (const layer of layers) {
            if (layer.id === layerId) {
                if (parent?.forceGroup) {
                    return parent;
                }
                return null;
            }
            if (layer.children) {
                const nextParent = layer.forceGroup ? layer : parent;
                const found = findParent(layer.children, nextParent);
                if (found !== undefined) return found;
            }
        }
        return undefined;
    };

    return findParent(layersArray);
};
