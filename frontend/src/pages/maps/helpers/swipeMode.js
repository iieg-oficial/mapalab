export const SWIPE_ORIGINAL_STORAGE_KEY = 'mapalab.swipe.original_snapshot';

export const emptyPane = (label) => ({
    activeLayerIds: [],
    hiddenLayerIds: [],
    layerOpacities: new Map(),
    filters: {},
    label,
});

export const initialCompareMode = () => ({
    active: false,
    activeSlot: 'A',
    paneA: emptyPane('A'),
    paneB: emptyPane('B'),
    originalSnapshot: null,
    swipePosition: 0.5,
    swipeOrientation: 'vertical',
    globalOrder: [],
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
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!parsed) return null;
        return {
            activeLayerIds: Array.isArray(parsed.activeLayerIds) ? parsed.activeLayerIds : [],
            hiddenLayerIds: Array.isArray(parsed.hiddenLayerIds) ? parsed.hiddenLayerIds : [],
            layerOpacities: new Map(Array.isArray(parsed.layerOpacities) ? parsed.layerOpacities : []),
            filters: parsed.filters || {},
            label: parsed.label || 'original',
        };
    } catch {
        return null;
    }
};
