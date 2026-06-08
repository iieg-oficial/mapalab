import { useEffect, useRef } from 'react';
import { serializeAnnotations } from '../helpers/annotationsSerialization';
import { ANNOTATIONS_STORAGE_KEY, ANNOTATIONS_MAX_BYTES } from '../helpers/drawingConstants';

export const useAnnotationsPersistence = ({ measurements, restoreAnnotations }) => {
    const hydratedRef = useRef(false);
    const pendingHydrationRef = useRef(false);

    useEffect(() => {
        if (hydratedRef.current) return;
        hydratedRef.current = true;
        let hasShare;
        try { hasShare = new URLSearchParams(window.location.search).has('s'); } catch { hasShare = false; }
        if (hasShare) return;
        let raw;
        try { raw = localStorage.getItem(ANNOTATIONS_STORAGE_KEY); } catch { raw = null; }
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
        if (!hydratedRef.current) return;
        if (pendingHydrationRef.current && measurements.length === 0) return;
        if (measurements.length > 0) pendingHydrationRef.current = false;
        try {
            const payload = serializeAnnotations(measurements);
            if (payload && payload.length) {
                const str = JSON.stringify(payload);
                if (str.length <= ANNOTATIONS_MAX_BYTES) {
                    localStorage.setItem(ANNOTATIONS_STORAGE_KEY, str);
                }
            } else {
                localStorage.removeItem(ANNOTATIONS_STORAGE_KEY);
            }
        } catch { /* storage no disponible */ }
    }, [measurements]);
};
