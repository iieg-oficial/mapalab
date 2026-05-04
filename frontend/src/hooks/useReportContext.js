import { useCallback, useContext } from 'react';
import { useLocation } from 'react-router';
import MapsContext from '@contexts/MapsContext';

const getMapSnapshot = (mapsContext) => {
    if (!mapsContext) return null;
    const { baseMapId, activeLayerIds, mapRef, compareMode } = mapsContext;
    let view = null;
    try {
        const olMap = mapRef?.current;
        if (olMap) {
            const v = olMap.getView();
            const center = v.getCenter();
            view = {
                zoom: v.getZoom() ?? null,
                resolution: v.getResolution() ?? null,
                center: center ? [Number(center[0].toFixed(2)), Number(center[1].toFixed(2))] : null
            };
        }
    } catch { /* noop */ }

    return {
        basemap: baseMapId ?? null,
        active_layer_ids: Array.isArray(activeLayerIds) ? activeLayerIds : [],
        view,
        compare_mode: compareMode?.active ? {
            orientation: compareMode.swipeOrientation ?? null,
            pane_a: compareMode.paneA?.label ?? null,
            pane_b: compareMode.paneB?.label ?? null
        } : null
    };
};

export const useReportContext = () => {
    const location = useLocation();
    const mapsContext = useContext(MapsContext);

    return useCallback((extraContext = {}) => {
        const base = {
            app_version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : null,
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            screen: typeof window !== 'undefined' ? {
                width: window.innerWidth,
                height: window.innerHeight,
                pixel_ratio: window.devicePixelRatio ?? 1
            } : null,
            referrer: typeof document !== 'undefined' ? document.referrer || null : null,
            timestamp: new Date().toISOString()
        };
        const map = getMapSnapshot(mapsContext);
        return {
            sourceApp: 'mapalab',
            sourceRoute: location?.pathname ?? null,
            sourceContext: {
                ...base,
                ...(map ? { map } : {}),
                ...extraContext
            }
        };
    }, [location, mapsContext]);
};
