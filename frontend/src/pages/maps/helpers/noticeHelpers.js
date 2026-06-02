const NOTICE_POSITIONS = ['top-center', 'bottom-center'];

const DEFAULT_NOTICE_POSITION = 'top-center';

const isValidNoticePosition = (pos) => NOTICE_POSITIONS.includes(pos);

const isNoticeInValidityWindow = (notice, now = new Date()) => {
    if (!notice) return false;
    const { validFrom, validUntil } = notice;
    const today = now.toISOString().slice(0, 10);
    if (validFrom && today < validFrom) return false;
    if (validUntil && today > validUntil) return false;
    return true;
};

const isZoomWithinRange = (zoom, range) => {
    if (zoom == null || !range) return true;
    let min = typeof range.min === 'number' ? range.min : null;
    let max = typeof range.max === 'number' ? range.max : null;
    if (min != null && max != null && min > max) [min, max] = [max, min];
    if (min != null && zoom < min) return false;
    if (max != null && zoom > max) return false;
    return true;
};

export const buildLayerIndex = (nodes) => {
    const index = new Map();
    const walk = (list) => {
        if (!Array.isArray(list)) return;
        list.forEach((node) => {
            if (node?.id) index.set(node.id, node);
            if (node?.children?.length) walk(node.children);
        });
    };
    walk(nodes || []);
    return index;
};

const stringHash = (str) => {
    let h = 5381;
    for (let i = 0; i < str.length; i += 1) {
        h = ((h << 5) + h) ^ str.charCodeAt(i);
    }
    return (h >>> 0).toString(36);
};

export const noticeContentHash = (notice) => {
    if (!notice) return '';
    const payload = JSON.stringify({
        t: notice.title || '',
        d: notice.description || '',
        v: notice.variant || '',
        i: notice.icon || '',
        c: notice.cta || null,
    });
    return stringHash(payload);
};

export const noticeDismissKey = (layerId, notice) =>
    `mapalab.notice.dismissed.${layerId}.${noticeContentHash(notice)}`;

const getPersistence = (notice) => {
    const value = notice?.dismissPersistence;
    return value === 'reopen' ? 'reopen' : 'permanent';
};

export const readDismissed = (layerId, notice, ephemeralSet) => {
    const persistence = getPersistence(notice);
    if (persistence === 'reopen') {
        return ephemeralSet?.has(noticeDismissKey(layerId, notice)) || false;
    }
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(noticeDismissKey(layerId, notice)) === '1';
    } catch {
        return false;
    }
};

export const writeDismissed = (layerId, notice, ephemeralSetter) => {
    const persistence = getPersistence(notice);
    const key = noticeDismissKey(layerId, notice);
    if (persistence === 'reopen') {
        ephemeralSetter?.(key);
        return;
    }
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, '1');
    } catch { /* storage full o bloqueado */ }
};

export const clearEphemeralForLayer = (ephemeralSet, layerId) => {
    if (!ephemeralSet || !layerId) return ephemeralSet;
    const prefix = `mapalab.notice.dismissed.${layerId}.`;
    const next = new Set();
    let changed = false;
    ephemeralSet.forEach((key) => {
        if (key.startsWith(prefix)) {
            changed = true;
        } else {
            next.add(key);
        }
    });
    return changed ? next : ephemeralSet;
};

const hasZoomBound = (range) =>
    range && (typeof range.min === 'number' || typeof range.max === 'number');

export const pickActiveNotices = ({
    activeLayerIds,
    layerIndex,
    currentZoom,
    now = new Date(),
}) => {
    if (!Array.isArray(activeLayerIds) || !layerIndex) return [];
    const seen = new Set();
    const out = [];
    activeLayerIds.forEach((id) => {
        if (seen.has(id)) return;
        seen.add(id);
        const node = layerIndex.get(id);
        const notice = node?.notice;
        if (!notice || !notice.enabled || !notice.title) return;
        if (!isNoticeInValidityWindow(notice, now)) return;
        const zoomRange = hasZoomBound(notice.zoomRange) ? notice.zoomRange : node?.zoomRange;
        if (!isZoomWithinRange(currentZoom, zoomRange)) return;
        const position = isValidNoticePosition(notice.position)
            ? notice.position
            : DEFAULT_NOTICE_POSITION;
        out.push({ layerId: id, layerLabel: node?.label || id, notice, position });
    });
    return out;
};

const POSITION_CLASSES = {
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2 items-center [padding-bottom:env(safe-area-inset-bottom)]',
};

export const positionToContainerClasses = (position) =>
    POSITION_CLASSES[position] || POSITION_CLASSES[DEFAULT_NOTICE_POSITION];

export const collapsePositionForMobile = () => 'top-center';

export const SIZE_ARROW = {
    compact: 14,
    small: 16,
    medium: 22,
    large: 26,
};

export const arrowMarginFor = (position, size) => {
    const arrowSize = SIZE_ARROW[size] || SIZE_ARROW.large;
    switch (position) {
    case 'top': return { marginTop: arrowSize };
    case 'bottom': return { marginBottom: arrowSize };
    case 'left': return { marginLeft: arrowSize };
    case 'right': return { marginRight: arrowSize };
    default: return {};
    }
};

export const NOTICE_VARIANT_BORDER = {
    info: 'border-2 border-[#5C2472]',
    warning: 'border-2 border-[#FF8300]',
    neutral: '',
};

export const NOTICE_SIZE_WIDTH_CLASS = {
    compact: 'w-[min(300px,calc(100vw-2rem))]',
    small: 'w-[min(360px,calc(100vw-2rem))]',
    medium: 'w-[min(440px,calc(100vw-2rem))]',
    large: 'w-[min(507px,calc(100vw-2rem))]',
};

export const DEFAULT_VARIANT_ICON = {
    info: 'info',
    warning: 'alert',
    neutral: null,
};
