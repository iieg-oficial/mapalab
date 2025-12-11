export const isParentLayer = (layer) => {
    return layer && layer.children && layer.children.length > 0;
};

export const isCategoryLayer = (layer) => {
    return layer && layer.isCategory === true;
};

export const hasWMSConfig = (layer) => {
    return layer && layer.wmsConfig && typeof layer.wmsConfig === 'object';
};

export const getWMSLayerName = (layer) => {
    return layer?.wmsConfig?.layerName || null;
};

export const findParentLayer = (layerId, layers) => {
    for (const layer of layers) {
        if (layer.children) {
            if (layer.children.some(child => child.id === layerId)) {
                return layer;
            }
            const found = findParentLayer(layerId, layer.children);
            if (found) return found;
        }
    }
    return null;
};

export const collectActiveChildren = (parentLayer, activeLayerIds) => {
    if (!isParentLayer(parentLayer)) {
        return [];
    }

    const activeChildren = [];

    const traverse = (children) => {
        for (const child of children) {
            if (activeLayerIds.includes(child.id)) {
                if (hasWMSConfig(child)) {
                    activeChildren.push(child);
                }

                if (isParentLayer(child)) {
                    traverse(child.children);
                }
            }
        }
    };

    traverse(parentLayer.children);
    return activeChildren;
};

export const groupLayersByWMS = (parent, children) => {
    const groups = new Map();

    children.forEach(child => {
        const layerName = getWMSLayerName(child) || 'unknown';

        if (!groups.has(layerName)) {
            groups.set(layerName, []);
        }
        groups.get(layerName).push(child);
    });

    const countLayersWithWMSName = (node, targetLayerName) => {
        let count = 0;

        if (getWMSLayerName(node) === targetLayerName) {
            count++;
        }

        if (node.children) {
            node.children.forEach(child => {
                count += countLayersWithWMSName(child, targetLayerName);
            });
        }

        return count;
    };

    const result = [];

    groups.forEach((groupChildren, layerName) => {
        const totalInParent = countLayersWithWMSName(parent, layerName);
        const shouldGroup = totalInParent > 1;

        if (shouldGroup) {
            const proxyLayer = {
                ...groupChildren[0],
                label: parent.label,
                _isProxy: true,
                _groupedChildren: groupChildren,
                _originalLabel: groupChildren[0].label
            };
            result.push(proxyLayer);
        } else {
            result.push(...groupChildren);
        }
    });

    return result;
};
