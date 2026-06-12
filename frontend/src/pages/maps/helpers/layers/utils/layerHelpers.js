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

export const findAncestorChain = (layerId, layersArray) => {
    if (!layerId || !Array.isArray(layersArray)) return [];
    const walk = (layers, trail) => {
        for (const layer of layers) {
            const nextTrail = [layer, ...trail];
            if (layer.id === layerId) return nextTrail;
            if (layer.children) {
                const found = walk(layer.children, nextTrail);
                if (found) return found;
            }
        }
        return null;
    };
    return walk(layersArray, []) || [];
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

export const collectCatalogUnits = (layer) => {
    if (!layer) return [];

    const result = [];

    const traverse = (node) => {
        if (!node) return;

        if (node.forceGroup) {
            if (node.wmsConfig || collectLayersWithWMS(node).length > 0) {
                result.push(node);
            }
            return;
        }

        if (node.wmsConfig) result.push(node);

        if (node.children && node.children.length > 0) {
            node.children.forEach(traverse);
        }
    };

    traverse(layer);
    return result;
};

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

export const resolveLayerDisplayName = (layerId, fallbackLabel, ancestor, getAlias) =>
    (ancestor && getAlias?.(ancestor.id)) || ancestor?.label || getAlias?.(layerId) || fallbackLabel || null;

export const groupAlternativeResults = (altResults, layersArray, getAlias) => {
    const grouped = new Map();

    altResults.forEach(r => {
        const parentGroup = findParentGroup(r.layerId, layersArray);
        const groupKey = parentGroup ? parentGroup.id : r.layerId;
        const groupName = resolveLayerDisplayName(r.layerId, r.layerName, parentGroup, getAlias);

        if (grouped.has(groupKey)) {
            grouped.get(groupKey).count += r.features?.length || 0;
        } else {
            grouped.set(groupKey, {
                id: groupKey,
                name: groupName,
                count: r.features?.length || 0,
                isGroup: !!parentGroup
            });
        }
    });

    return Array.from(grouped.values());
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
