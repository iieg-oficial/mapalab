import { useEffect, useRef } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useShareSerializer } from './useShareSerializer';

export const SESSION_STORAGE_KEY = 'mapalab.session.state';
const SAVE_DEBOUNCE_MS = 500;

export const useSessionPersistence = () => {
    const { activeLayerIds, filters, layerOpacities, hiddenLayerIds, selectedLayerForSymbology, baseMapId, mapRef } = useMapsContext();
    const serialize = useShareSerializer();
    const saveTimerRef = useRef(null);
    // Solo borramos sessionStorage si el user "explicitamente" vacio sus capas.
    // Sin este flag, el primer render con activeLayerIds=[] (antes de que
    // useInitializeFromUrl corra) borraria el storage que el user queria restaurar.
    const hasBeenPopulatedRef = useRef(false);

    useEffect(() => {
        if (!Array.isArray(activeLayerIds)) return;

        if (activeLayerIds.length === 0) {
            if (hasBeenPopulatedRef.current) {
                try { sessionStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* quota / disabled */ }
            }
            return;
        }

        hasBeenPopulatedRef.current = true;

        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            try {
                const envelope = serialize('single');
                sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(envelope));
            } catch { /* quota or serialization error — ignore */ }
        }, SAVE_DEBOUNCE_MS);

        return () => clearTimeout(saveTimerRef.current);
    }, [activeLayerIds, filters, layerOpacities, hiddenLayerIds, selectedLayerForSymbology, baseMapId, serialize]);

    useEffect(() => {
        const map = mapRef?.current;
        if (!map) return;
        const handler = () => {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => {
                try {
                    const envelope = serialize('single');
                    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(envelope));
                } catch { /* ignore */ }
            }, SAVE_DEBOUNCE_MS);
        };
        map.on('moveend', handler);
        return () => map.un('moveend', handler);
    }, [mapRef, serialize]);
};
