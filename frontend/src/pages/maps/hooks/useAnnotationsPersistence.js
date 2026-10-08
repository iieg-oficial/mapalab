import { useEffect, useRef } from 'react';
import { serializeAnnotations } from '../helpers/annotationsSerialization';
import { ANNOTATIONS_STORAGE_KEY, ANNOTATIONS_MAX_BYTES } from '../helpers/drawingConstants';

const almacen = (tipo) => (tipo === 'session' ? window.sessionStorage : window.localStorage);

export const useAnnotationsPersistence = ({ measurements, restoreAnnotations, storageKey = ANNOTATIONS_STORAGE_KEY, storageType = 'local' }) => {
    const hydratedRef = useRef(false);
    const pendingHydrationRef = useRef(false);
    const compartidoRef = useRef(false);

    useEffect(() => {
        if (hydratedRef.current) return;
        hydratedRef.current = true;
        let hasShare;
        try { hasShare = new URLSearchParams(window.location.search).has('s'); } catch { hasShare = false; }
        compartidoRef.current = hasShare;
        if (hasShare) return;
        let raw;
        try { raw = almacen(storageType).getItem(storageKey); } catch { raw = null; }
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) {
                    pendingHydrationRef.current = true;
                    restoreAnnotations(parsed, { showTools: false });
                }
            } catch { /* json corrupto */ }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!hydratedRef.current || compartidoRef.current) return;
        if (pendingHydrationRef.current && measurements.length === 0) return;
        if (measurements.length > 0) pendingHydrationRef.current = false;
        try {
            const payload = serializeAnnotations(measurements);
            if (payload && payload.length) {
                const str = JSON.stringify(payload);
                if (str.length <= ANNOTATIONS_MAX_BYTES) {
                    almacen(storageType).setItem(storageKey, str);
                }
            } else {
                almacen(storageType).removeItem(storageKey);
            }
        } catch { /* storage no disponible */ }
    }, [measurements, storageKey, storageType]);
};
