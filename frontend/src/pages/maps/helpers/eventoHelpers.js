const layerWorkspace = (n) =>
    n.workspaceAlias || n.wmsConfig?.workspace || n.wmsConfig?.geoserverWorkspace || null;

const layerName = (n) =>
    n.geoserverLayer || n.wmsConfig?.geoserverLayer || n.wmsConfig?.wmsGroup || null;

export const findLayerByWorkspaceLayer = (workspace, layer, nodes) => {
    for (const node of nodes || []) {
        if (layerWorkspace(node) === workspace && layerName(node) === layer) {
            return node;
        }
        if (node.children?.length) {
            const found = findLayerByWorkspaceLayer(workspace, layer, node.children);
            if (found) return found;
        }
    }
    return null;
};

export const getEventoLayerIds = (evento, allLayers) => {
    const ids = new Set();
    if (!evento?.capas?.length || !allLayers?.length) return ids;
    for (const c of evento.capas) {
        if (c.tipo === 'etiqueta') continue;
        const layer = findLayerByWorkspaceLayer(c.workspace, c.layer, allLayers);
        if (layer) ids.add(layer.id);
    }
    return ids;
};

export const findEventoByLayerId = (eventos, layerId, allLayers) => {
    if (!layerId || !Array.isArray(eventos) || !eventos.length) return null;
    for (const evento of eventos) {
        if (getEventoLayerIds(evento, allLayers).has(layerId)) return evento;
    }
    return null;
};
