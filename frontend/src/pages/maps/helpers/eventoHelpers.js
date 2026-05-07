const layerWorkspace = (n) =>
    n.workspaceAlias || n.wmsConfig?.workspace || n.wmsConfig?.geoserverWorkspace || null;

const layerName = (n) =>
    n.geoserverLayer || n.wmsConfig?.geoserverLayer || n.wmsConfig?.wmsGroup || null;

const indexKey = (workspace, layer) => `${workspace || ''}|${layer || ''}`;

export const buildLayerIndex = (nodes) => {
    const index = new Map();
    const walk = (list) => {
        for (const node of list || []) {
            const ws = layerWorkspace(node);
            const ln = layerName(node);
            if (ws && ln) {
                const key = indexKey(ws, ln);
                if (!index.has(key)) index.set(key, node);
            }
            if (node.children?.length) walk(node.children);
        }
    };
    walk(nodes);
    return index;
};

export const findLayerByWorkspaceLayer = (workspace, layer, nodes) => {
    if (!workspace || !layer) return null;
    return buildLayerIndex(nodes).get(indexKey(workspace, layer)) || null;
};

const collectEventoLayerIds = (evento, layerIndex) => {
    const ids = new Set();
    if (!evento?.capas?.length) return ids;
    for (const c of evento.capas) {
        if (c.tipo === 'etiqueta') continue;
        const layer = layerIndex.get(indexKey(c.workspace, c.layer));
        if (layer) ids.add(layer.id);
    }
    return ids;
};

export const getEventoLayerIds = (evento, allLayers) => {
    if (!evento?.capas?.length || !allLayers?.length) return new Set();
    return collectEventoLayerIds(evento, buildLayerIndex(allLayers));
};

export const buildEventoIndex = (eventos, allLayers) => {
    const layerIndex = buildLayerIndex(allLayers);
    const eventoByLayerId = new Map();
    const layerIdsByEvento = new Map();
    for (const evento of eventos || []) {
        const ids = collectEventoLayerIds(evento, layerIndex);
        layerIdsByEvento.set(evento.id, ids);
        for (const id of ids) {
            if (!eventoByLayerId.has(id)) eventoByLayerId.set(id, evento);
        }
    }
    return { layerIndex, eventoByLayerId, layerIdsByEvento };
};

export const findEventoByLayerId = (eventos, layerId, allLayers) => {
    if (!layerId || !Array.isArray(eventos) || !eventos.length) return null;
    return buildEventoIndex(eventos, allLayers).eventoByLayerId.get(layerId) || null;
};
