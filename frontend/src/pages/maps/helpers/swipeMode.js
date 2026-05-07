export const SWIPE_ORIGINAL_STORAGE_KEY = 'mapalab.swipe.original_snapshot';
export const SWIPE_ORIENTATION_STORAGE_KEY = 'mapalab.swipe.orientation';

export const SWIPE_POS_MIN = 0.05;
export const SWIPE_POS_MAX = 0.95;
export const SWIPE_HANDLE_MIN = 5;
export const SWIPE_HANDLE_MAX = 95;
export const SWIPE_KEYBOARD_STEP = 5;
export const SWIPE_DEBOUNCE_MS = 200;
export const SWIPE_POS_THRESHOLD = 0.005;
export const SWIPE_POS_JITTER = 0.1;
export const SNAPSHOT_MAX_BYTES = 100_000;

export const safeStructuredClone = (obj) => {
    if (typeof structuredClone === 'function') {
        try { return structuredClone(obj); } catch { /* fallback */ }
    }
    try { return JSON.parse(JSON.stringify(obj)); } catch { return obj; }
};

const isValidStoredSnapshot = (parsed) => (
    parsed !== null && typeof parsed === 'object'
    && Array.isArray(parsed.activeLayerIds)
    && Array.isArray(parsed.hiddenLayerIds)
    && (parsed.layerOpacities === undefined || Array.isArray(parsed.layerOpacities))
    && (parsed.filters === undefined || (typeof parsed.filters === 'object' && parsed.filters !== null))
);

export const emptyPane = (label) => ({
    activeLayerIds: [],
    hiddenLayerIds: [],
    layerOpacities: new Map(),
    filters: {},
    label,
});

const readPersistedOrientation = () => {
    try {
        const value = localStorage.getItem(SWIPE_ORIENTATION_STORAGE_KEY);
        return value === 'horizontal' || value === 'vertical' ? value : 'vertical';
    } catch {
        return 'vertical';
    }
};

export const persistOrientation = (orientation) => {
    try {
        if (orientation === 'horizontal' || orientation === 'vertical') {
            localStorage.setItem(SWIPE_ORIENTATION_STORAGE_KEY, orientation);
        }
    } catch { /* storage no disponible */ }
};

export const initialCompareMode = () => ({
    active: false,
    activeSlot: 'A',
    paneA: emptyPane('A'),
    paneB: emptyPane('B'),
    originalSnapshot: null,
    swipePosition: 0.5,
    swipeOrientation: readPersistedOrientation(),
    globalOrder: [],
});

export const purgePane = (pane, idsSet) => ({
    ...pane,
    activeLayerIds: pane.activeLayerIds.filter(id => !idsSet.has(id)),
    hiddenLayerIds: pane.hiddenLayerIds.filter(id => !idsSet.has(id)),
    layerOpacities: new Map(
        Array.from(pane.layerOpacities.entries()).filter(([id]) => !idsSet.has(id))
    ),
    filters: Object.fromEntries(
        Object.entries(pane.filters).filter(([id]) => !idsSet.has(id))
    ),
});

export const addIdsToPane = (pane, allIds, sourcePane, live) => {
    const newIds = [...pane.activeLayerIds];
    allIds.forEach(id => { if (!newIds.includes(id)) newIds.push(id); });
    const newOpacities = new Map(pane.layerOpacities);
    const newFilters = { ...pane.filters };
    allIds.forEach(id => {
        if (sourcePane?.layerOpacities?.has?.(id)) {
            newOpacities.set(id, sourcePane.layerOpacities.get(id));
        } else if (live?.layerOpacities?.has?.(id)) {
            newOpacities.set(id, live.layerOpacities.get(id));
        }
        if (sourcePane?.filters?.[id]) {
            newFilters[id] = { ...sourcePane.filters[id] };
        } else if (live?.filters?.[id]) {
            newFilters[id] = { ...live.filters[id] };
        }
    });
    return { ...pane, activeLayerIds: newIds, layerOpacities: newOpacities, filters: newFilters };
};

export const computeGlobalOrder = (prevOrder, paneA, paneB, newIdsToAppend = []) => {
    const stillActiveIds = new Set([...paneA.activeLayerIds, ...paneB.activeLayerIds]);
    const existingOrder = (prevOrder || []).filter(id => stillActiveIds.has(id));
    const appended = newIdsToAppend.filter(id => stillActiveIds.has(id) && !existingOrder.includes(id));
    return [...existingOrder, ...appended];
};

export const snapshotFromLive = (live, label) => ({
    activeLayerIds: [...(live?.activeLayerIds || [])],
    hiddenLayerIds: [...(live?.hiddenLayerIds || [])],
    layerOpacities: new Map(live?.layerOpacities || []),
    filters: safeStructuredClone(live?.filters || {}),
    label,
});

export const serializeSnapshotForStorage = (snapshot) => ({
    activeLayerIds: snapshot.activeLayerIds,
    hiddenLayerIds: snapshot.hiddenLayerIds,
    layerOpacities: Array.from(snapshot.layerOpacities.entries()),
    filters: snapshot.filters,
    label: snapshot.label,
});

export const deserializeSnapshotFromStorage = (raw) => {
    if (!raw) return null;
    try {
        if (typeof raw === 'string' && raw.length > SNAPSHOT_MAX_BYTES) return null;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!isValidStoredSnapshot(parsed)) return null;
        return {
            activeLayerIds: parsed.activeLayerIds,
            hiddenLayerIds: parsed.hiddenLayerIds,
            layerOpacities: new Map(Array.isArray(parsed.layerOpacities) ? parsed.layerOpacities : []),
            filters: parsed.filters || {},
            label: typeof parsed.label === 'string' ? parsed.label : 'original',
        };
    } catch {
        return null;
    }
};
