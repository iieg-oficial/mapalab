import { useEffect, useRef } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useShareSerializer } from './useShareSerializer';

export const SESSION_STORAGE_KEY = 'mapalab.session.state';
const SAVE_DEBOUNCE_MS = 500;

export const useSessionPersistence = () => {
    const {
        activeLayerIds,
        filters,
        layerOpacities,
        hiddenLayerIds,
        selectedLayerForSymbology,
        baseMapId,
        mapRef,
        compareMode,
    } = useMapsContext();
    const serialize = useShareSerializer();
    const saveTimerRef = useRef(null);
    const hasBeenPopulatedRef = useRef(false);

    const persist = () => {
        try {
            const envelope = compareMode?.active
                ? serialize('swipe', { position: compareMode.swipePosition ?? 0.5 })
                : serialize('single');
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(envelope));
        } catch { /* quota or serialization error — ignore */ }
    };

    useEffect(() => {
        if (!Array.isArray(activeLayerIds)) return;

        const swipeActive = !!compareMode?.active;

        if (activeLayerIds.length === 0 && !swipeActive) {
            if (hasBeenPopulatedRef.current) {
                try { sessionStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* quota / disabled */ }
            }
            return;
        }

        hasBeenPopulatedRef.current = true;

        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(persist, SAVE_DEBOUNCE_MS);

        return () => clearTimeout(saveTimerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeLayerIds, filters, layerOpacities, hiddenLayerIds, selectedLayerForSymbology, baseMapId, serialize, compareMode]);

    useEffect(() => {
        const map = mapRef?.current;
        if (!map) return;
        const handler = () => {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(persist, SAVE_DEBOUNCE_MS);
        };
        map.on('moveend', handler);
        return () => map.un('moveend', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapRef, serialize, compareMode]);
};
