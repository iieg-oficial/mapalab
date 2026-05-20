import { useEffect, useMemo, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import {
    buildLayerIndex,
    pickActiveNotices,
    readDismissed,
    writeDismissed,
    clearEphemeralForLayer,
    noticeDismissKey,
} from '@pages/maps/helpers/noticeHelpers';

const useCurrentZoom = (mapRef, paneMapInstances, active) => {
    const subscribe = useCallback((notify) => {
        if (!active) return () => {};
        let stopped = false;
        let mapInstance = null;
        let pollId = null;

        const handler = () => notify();

        const attach = () => {
            if (stopped) return true;
            const map = paneMapInstances?.[0] || mapRef?.current;
            if (!map) return false;
            mapInstance = map;
            map.on('moveend', handler);
            notify();
            return true;
        };

        if (!attach()) {
            pollId = setInterval(() => {
                if (attach()) {
                    clearInterval(pollId);
                    pollId = null;
                }
            }, 250);
        }

        return () => {
            stopped = true;
            if (pollId) clearInterval(pollId);
            if (mapInstance) mapInstance.un('moveend', handler);
        };
    }, [mapRef, paneMapInstances, active]);

    const getSnapshot = useCallback(() => {
        if (!active) return null;
        const map = paneMapInstances?.[0] || mapRef?.current;
        const z = map?.getView?.()?.getZoom?.();
        return typeof z === 'number' ? Math.round(z) : null;
    }, [mapRef, paneMapInstances, active]);

    return useSyncExternalStore(subscribe, getSnapshot, () => null);
};

const asMobileNotice = (notice) => ({ ...notice, dismissPersistence: 'reopen', dismissible: true });

export const useLayerNotices = ({ enabled = true, mobileMode = false } = {}) => {
    const {
        allLayers,
        activeLayerIds,
        compareMode,
        mapRef,
        paneMapInstances,
    } = useMapsContext();

    const isSwipe = !!compareMode?.active;

    const effectiveIds = useMemo(() => {
        if (!enabled) return [];
        if (!isSwipe) return activeLayerIds || [];
        const a = compareMode.paneA?.activeLayerIds || [];
        const b = compareMode.paneB?.activeLayerIds || [];
        return Array.from(new Set([...a, ...b]));
    }, [enabled, isSwipe, activeLayerIds, compareMode?.paneA?.activeLayerIds, compareMode?.paneB?.activeLayerIds]);

    const layerIndex = useMemo(() => buildLayerIndex(allLayers), [allLayers]);

    const needsZoomTracking = useMemo(() => {
        if (!enabled || effectiveIds.length === 0) return false;
        for (const id of effectiveIds) {
            const node = layerIndex.get(id);
            if (!node?.notice?.enabled) continue;
            const noticeRange = node.notice.zoomRange;
            const layerRange = node.zoomRange;
            if (noticeRange && (typeof noticeRange.min === 'number' || typeof noticeRange.max === 'number')) return true;
            if (layerRange && (typeof layerRange.min === 'number' || typeof layerRange.max === 'number')) return true;
        }
        return false;
    }, [enabled, effectiveIds, layerIndex]);

    const currentZoom = useCurrentZoom(mapRef, paneMapInstances, needsZoomTracking);

    const [dismissedTick, setDismissedTick] = useState(0);
    const [ephemeralDismissed, setEphemeralDismissed] = useState(() => new Set());
    const prevActiveIdsRef = useRef(new Set());

    useEffect(() => {
        const current = new Set(effectiveIds);
        const prev = prevActiveIdsRef.current;
        const reactivated = [];
        current.forEach((id) => { if (!prev.has(id)) reactivated.push(id); });
        prevActiveIdsRef.current = current;
        if (reactivated.length === 0) return;
        setEphemeralDismissed((prevSet) => {
            let next = prevSet;
            reactivated.forEach((id) => { next = clearEphemeralForLayer(next, id); });
            return next;
        });
    }, [effectiveIds]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const handler = (e) => {
            if (typeof e?.key === 'string' && e.key.startsWith('mapalab.notice.dismissed.')) {
                setDismissedTick((t) => t + 1);
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    const notices = useMemo(() => {
        if (!enabled) return [];
        const picked = pickActiveNotices({
            activeLayerIds: effectiveIds,
            layerIndex,
            currentZoom,
        });
        return picked.filter(({ layerId, notice }) => {
            const effective = mobileMode ? asMobileNotice(notice) : notice;
            return !readDismissed(layerId, effective, ephemeralDismissed);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, effectiveIds, layerIndex, currentZoom, dismissedTick, ephemeralDismissed, mobileMode]);

    const dismiss = useCallback((layerId, notice) => {
        const effective = mobileMode ? asMobileNotice(notice) : notice;
        writeDismissed(layerId, effective, (key) => {
            setEphemeralDismissed((prevSet) => {
                if (prevSet.has(key)) return prevSet;
                const next = new Set(prevSet);
                next.add(key);
                return next;
            });
        });
        setDismissedTick((t) => t + 1);
    }, [mobileMode]);

    return { notices, dismiss, dismissKey: noticeDismissKey };
};

export default useLayerNotices;
