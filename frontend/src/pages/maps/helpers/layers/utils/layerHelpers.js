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

export const getLayersWithWMS = (layersArray) => {
    const result = [];
    
    const traverse = (layers) => {
        for (const layer of layers) {
            if (layer.wmsConfig) {
                result.push(layer);
            }
            if (layer.children) {
                traverse(layer.children);
            }
        }
    };
    
    traverse(layersArray);
    return result;
};

export const loadLayerSymbology = async (layer) => {
    if (!layer.wmsConfig) {
        return layer;
    }

    try {
        
        return {
            ...layer,
            symbologyLoaded: true,
            symbologyError: null
        };
    } catch (error) {
        console.error(`❌ Error cargando simbología para ${layer.label}:`, error);
        
        return {
            ...layer,
            symbologyLoaded: false,
            symbologyError: error.message
        };
    }
};

export const loadMultipleLayersSymbology = async (layers) => {
    const promises = layers.map(layer => loadLayerSymbology(layer));
    return Promise.all(promises);
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
