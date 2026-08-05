import { parseLatLng } from '@pages/maps/helpers/defaultView';

const ICON_ALLOWED_SCHEMES = ['https:', 'http:'];
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const MARKER_TITLE_MAX = 120;
const MARKER_DESCRIPTION_MAX = 400;


export const sanitizeIconUrl = (raw) => {
    if (!raw) return null;
    const value = String(raw).trim();
    if (value.startsWith('data:image/')) return value;
    try {
        const parsed = new URL(value, window.location.origin);
        return ICON_ALLOWED_SCHEMES.includes(parsed.protocol) ? parsed.href : null;
    } catch {
        return null;
    }
};


export const sanitizeColor = (raw) => {
    if (!raw) return null;
    const value = String(raw).trim();
    return HEX_COLOR.test(value) ? value : null;
};


export const sanitizeText = (raw, maxLength) => {
    if (!raw) return null;
    const value = String(raw).replace(/\s+/g, ' ').trim();
    return value ? value.slice(0, maxLength) : null;
};


export const parseEmbedParams = (searchParams) => {
    const key = searchParams.get('key') || '';
    const share = searchParams.get('s') || searchParams.get('share') || '';
    const layersRaw = searchParams.get('layers') || '';
    const layers = layersRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const zoomRaw = searchParams.get('zoom');
    const basemap = searchParams.get('basemap') || 'osm';
    const controlsRaw = searchParams.get('controls') || 'zoom';
    const controls = controlsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    const centerCoords = parseLatLng(searchParams.get('center'));
    const markerCoords = parseLatLng(searchParams.get('marker'));

    const zoom = zoomRaw ? Number(zoomRaw) : null;
    const notices = searchParams.get('notices');
    return {
        key,
        share,
        layers,
        center: centerCoords,
        zoom: Number.isFinite(zoom) ? zoom : null,
        basemap,
        controls,
        notices,
        marker: markerCoords,
        markerIcon: sanitizeIconUrl(searchParams.get('markerIcon')),
        markerColor: sanitizeColor(searchParams.get('markerColor')),
        markerTitle: sanitizeText(searchParams.get('markerTitle'), MARKER_TITLE_MAX),
        markerDescription: sanitizeText(searchParams.get('markerDescription'), MARKER_DESCRIPTION_MAX),
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
