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

export const buildEventoShareUrl = (evento) => {
    const slug = evento?.slug || slugifyTitulo(evento?.titulo) || evento?.id || '';
    const rawBase = import.meta.env.BASE_URL || '/';
    const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
    return `${window.location.origin}${base}mapa?evento=${slug}`;
};

export const findLayerByWorkspaceLayer = (workspace, layer, nodes) => {
    if (!workspace || !layer) return null;
    return buildLayerIndex(nodes).get(indexKey(workspace, layer)) || null;
};

const collectEventoLayerIds = (evento, layerIndex) => {
    const ids = new Set();
    const walk = (capas) => {
        for (const c of capas || []) {
            if (c.tipo === 'etiqueta') continue;
            if (c.tipo === 'categoria') { walk(c.capas); continue; }
            const layer = layerIndex.get(indexKey(c.workspace, c.layer));
            if (layer) ids.add(layer.id);
        }
    };
    walk(evento?.capas);
    return ids;
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
