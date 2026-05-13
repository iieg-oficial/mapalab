export const parseEmbedParams = (searchParams) => {
    const key = searchParams.get('key') || '';
    const share = searchParams.get('s') || searchParams.get('share') || '';
    const layersRaw = searchParams.get('layers') || '';
    const layers = layersRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const center = searchParams.get('center');
    const zoomRaw = searchParams.get('zoom');
    const basemap = searchParams.get('basemap') || 'osm';
    const controlsRaw = searchParams.get('controls') || 'zoom';
    const controls = controlsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    let centerCoords = null;
    if (center) {
        const parts = center.split(',').map((n) => Number(n.trim()));
        if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
            centerCoords = parts;
        }
    }

    const zoom = zoomRaw ? Number(zoomRaw) : null;
    return {
        key,
        share,
        layers,
        center: centerCoords,
        zoom: Number.isFinite(zoom) ? zoom : null,
        basemap,
        controls,
    };
};


const findLayersByWorkspaceLayer = (tree, workspace, layerName) => {
    const matches = [];
    const queue = [...tree];
    while (queue.length > 0) {
        const node = queue.shift();
        const wms = node.wmsConfig;
        if (wms) {
            const aliasWs = wms.workspace || '';
            const realWs = wms.geoserverWorkspace || aliasWs;
            const gsLayer = wms.geoserverLayer || '';
            const wsMatch = workspace === aliasWs || workspace === realWs;
            if (wsMatch && gsLayer === layerName) {
                matches.push(node);
            }
        }
        if (node.children?.length) {
            queue.push(...node.children);
        }
    }
    return matches;
};


export const resolveEmbedLayers = (tree, requested) => {
    const ids = [];
    const seen = new Set();
    for (const ref of requested) {
        const idx = ref.indexOf(':');
        if (idx === -1) {
            const direct = findNodeById(tree, ref);
            if (direct && !seen.has(direct.id)) {
                ids.push(direct.id);
                seen.add(direct.id);
            }
            continue;
        }
        const workspace = ref.slice(0, idx);
        const layerName = ref.slice(idx + 1);
        const matches = findLayersByWorkspaceLayer(tree, workspace, layerName);
        for (const node of matches) {
            if (!seen.has(node.id)) {
                ids.push(node.id);
                seen.add(node.id);
            }
        }
    }
    return ids;
};


const findNodeById = (tree, id) => {
    const queue = [...tree];
    while (queue.length > 0) {
        const node = queue.shift();
        if (node.id === id) return node;
        if (node.children?.length) queue.push(...node.children);
    }
    return null;
};
