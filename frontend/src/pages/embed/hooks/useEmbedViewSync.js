import { useEffect, useRef } from 'react';
import { fromLonLat, toLonLat } from 'ol/proj';
import { useMapsContext } from '@hooks/useMaps';
import { isMessageFromParent, postViewChange } from '@pages/embed/helpers/postMessage';


const THROTTLE_MS = 200;


const applyExternalView = (view, payload) => {
    if (!view || !payload || typeof payload !== 'object') return;
    if (typeof payload.lon === 'number' && typeof payload.lat === 'number') {
        view.setCenter(fromLonLat([payload.lon, payload.lat]));
    }
    if (typeof payload.zoom === 'number') {
        view.setZoom(payload.zoom);
    }
};


export const useEmbedViewSync = () => {
    const { mapRef } = useMapsContext();
    const lastEmittedRef = useRef(0);
    const pendingRef = useRef(null);
    const suppressEmitRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        let intervalId = null;
        let removeMessageListener = null;

        const attach = () => {
            if (cancelled) return false;
            const map = mapRef?.current;
            if (!map) return false;
            const view = map.getView();
            if (!view) return false;

            const emit = (force = false) => {
                if (suppressEmitRef.current) return;
                const now = Date.now();
                if (!force && now - lastEmittedRef.current < THROTTLE_MS) {
                    pendingRef.current = setTimeout(() => emit(true), THROTTLE_MS);
                    return;
                }
                if (pendingRef.current) {
                    clearTimeout(pendingRef.current);
                    pendingRef.current = null;
                }
                lastEmittedRef.current = now;
                const center = view.getCenter();
                const zoom = view.getZoom();
                if (!center || zoom == null) return;
                const [lon, lat] = toLonLat(center);
                postViewChange({ lon, lat, zoom });
            };

            const onMove = () => emit(false);
            view.on('change:center', onMove);
            view.on('change:resolution', onMove);
            emit(true);

            const onMessage = (event) => {
                if (!isMessageFromParent(event)) return;
                const data = event?.data;
                if (!data || typeof data !== 'object' || data.type !== 'mapalab:setview') return;
                suppressEmitRef.current = true;
                applyExternalView(view, data.payload);
                setTimeout(() => { suppressEmitRef.current = false; }, 400);
            };
            window.addEventListener('message', onMessage);
            removeMessageListener = () => window.removeEventListener('message', onMessage);

            return () => {
                view.un('change:center', onMove);
                view.un('change:resolution', onMove);
                if (pendingRef.current) {
                    clearTimeout(pendingRef.current);
                    pendingRef.current = null;
                }
                if (removeMessageListener) {
                    removeMessageListener();
                    removeMessageListener = null;
                }
            };
        };

        let cleanup = attach();
        if (!cleanup) {
            intervalId = setInterval(() => {
                cleanup = attach();
                if (cleanup) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            }, 200);
        }

        return () => {
            cancelled = true;
            if (intervalId) clearInterval(intervalId);
            if (typeof cleanup === 'function') cleanup();
        };
    }, [mapRef]);
};
