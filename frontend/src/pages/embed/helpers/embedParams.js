import { parseLatLng } from '@pages/maps/helpers/defaultView';

const ICON_ALLOWED_SCHEMES = ['https:', 'http:'];
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const MARKER_TITLE_MAX = 120;
const MARKER_DESCRIPTION_MAX = 400;

export const CARD_BLOCKS = ['chips', 'rows', 'links', 'tiles'];
export const CARD_ICONS = ['ubicacion', 'celular', 'web', 'mapas'];
export const VISOR_HREF = '@visor';
const CARD_MAX_BYTES = 4096;
const CARD_LIMITS = { chips: 6, rows: 6, links: 8, tiles: 6 };
const CARD_TEXT_MAX = { chip: 60, label: 80, row: 400, link: 120, tile: 40 };
const CARD_HREF_SCHEMES = ['https:', 'http:', 'tel:', 'mailto:'];


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


const sanitizeCardHref = (raw) => {
    if (typeof raw !== 'string') return null;
    const value = raw.trim();
    if (value === VISOR_HREF) return VISOR_HREF;
    try {
        const parsed = new URL(value);
        return CARD_HREF_SCHEMES.includes(parsed.protocol) ? value : null;
    } catch {
        return null;
    }
};


const sanitizeCardText = (raw, maxLength) => (
    typeof raw === 'string' || typeof raw === 'number' ? sanitizeText(raw, maxLength) : null
);


const sanitizeTileValue = (raw) => {
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
    return sanitizeCardText(raw, CARD_TEXT_MAX.tile);
};


const cardItems = (raw, limit) => (Array.isArray(raw) ? raw : [])
    .filter((item) => item && typeof item === 'object')
    .slice(0, limit);


const byteLength = (value) => (
    typeof TextEncoder === 'function' ? new TextEncoder().encode(value).length : value.length
);


export const sanitizeMarkerCard = (raw) => {
    if (!raw) return null;
    const value = String(raw);
    if (byteLength(value) > CARD_MAX_BYTES) return null;
    let parsed;
    try {
        parsed = JSON.parse(value);
    } catch {
        return null;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    const chips = cardItems(parsed.chips, CARD_LIMITS.chips)
        .map((chip) => ({ text: sanitizeCardText(chip.text, CARD_TEXT_MAX.chip), style: chip.style === 'solid' ? 'solid' : 'soft' }))
        .filter((chip) => chip.text);
    const rows = cardItems(parsed.rows, CARD_LIMITS.rows)
        .map((row) => ({ label: sanitizeCardText(row.label, CARD_TEXT_MAX.label), text: sanitizeCardText(row.text, CARD_TEXT_MAX.row) }))
        .filter((row) => row.text);
    const links = cardItems(parsed.links, CARD_LIMITS.links)
        .map((link) => ({ icon: CARD_ICONS.includes(link.icon) ? link.icon : null, text: sanitizeCardText(link.text, CARD_TEXT_MAX.link), href: sanitizeCardHref(link.href) }))
        .filter((link) => link.icon && link.text);
    const tiles = cardItems(parsed.tiles, CARD_LIMITS.tiles)
        .map((tile) => ({ value: sanitizeTileValue(tile.value), label: sanitizeCardText(tile.label, CARD_TEXT_MAX.label) }))
        .filter((tile) => tile.value !== null && tile.label);
    const order = Array.isArray(parsed.order)
        ? [...new Set(parsed.order.filter((key) => CARD_BLOCKS.includes(key)))]
        : CARD_BLOCKS;

    if (!chips.length && !rows.length && !links.length && !tiles.length) return null;
    return { chips, rows, links, tiles, order: order.length ? order : CARD_BLOCKS, open: parsed.open !== false };
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
        markerCard: sanitizeMarkerCard(searchParams.get('markerCard')),
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
