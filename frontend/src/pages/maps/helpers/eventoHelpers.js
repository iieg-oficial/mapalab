const layerWorkspace = (n) =>
    n.workspaceAlias || n.wmsConfig?.workspace || n.wmsConfig?.geoserverWorkspace || null;

const layerName = (n) =>
    n.geoserverLayer || n.wmsConfig?.geoserverLayer || n.wmsConfig?.wmsGroup || null;

const indexKey = (workspace, layer) => `${workspace || ''}|${layer || ''}`;

const buildLayerIndex = (nodes) => {
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

const DIACRITICS_RE = /[̀-ͯ]/g;

export const slugifyTitulo = (titulo) =>
    (titulo || '')
        .normalize('NFD')
        .replace(DIACRITICS_RE, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);

export const findLayerByWorkspaceLayer = (workspace, layer, nodes) => {
    if (!workspace || !layer) return null;
    return buildLayerIndex(nodes).get(indexKey(workspace, layer)) || null;
};

const collectEventoLayerIds = (evento, layerIndex) => {
    const ids = new Set();
    const aliasById = new Map();
    const walk = (capas) => {
        for (const c of capas || []) {
            if (c.tipo === 'etiqueta') continue;
            if (c.tipo === 'categoria') { walk(c.capas); continue; }
            const layer = layerIndex.get(indexKey(c.workspace, c.layer));
            if (!layer) continue;
            ids.add(layer.id);
            const alias = typeof c.alias === 'string' ? c.alias.trim() : '';
            if (alias && !aliasById.has(layer.id)) aliasById.set(layer.id, alias);
        }
    };
    walk(evento?.capas);
    return { ids, aliasById };
};

export const buildEventoIndex = (eventos, allLayers) => {
    const layerIndex = buildLayerIndex(allLayers);
    const eventoByLayerId = new Map();
    const layerIdsByEvento = new Map();
    const aliasByLayerId = new Map();
    for (const evento of eventos || []) {
        const { ids, aliasById } = collectEventoLayerIds(evento, layerIndex);
        layerIdsByEvento.set(evento.id, ids);
        for (const id of ids) {
            if (!eventoByLayerId.has(id)) eventoByLayerId.set(id, evento);
        }
        for (const [id, alias] of aliasById) {
            if (!aliasByLayerId.has(id)) aliasByLayerId.set(id, alias);
        }
    }
    return { layerIndex, eventoByLayerId, layerIdsByEvento, aliasByLayerId };
};
