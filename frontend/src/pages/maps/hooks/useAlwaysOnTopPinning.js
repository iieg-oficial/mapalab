import { useEffect, useMemo, useRef, useState } from 'react';
import { useLayers } from '@hooks/useLayers';
import { useDebounce } from '@hooks/useDebounce';
import { findWMSConfig, hasWMSConfig } from '@pages/maps/helpers/wmsConfig';
import { fetchGeometryType } from '@utils/featureInfoUtils';

const ALWAYS_ON_TOP_LAYER_IDS = new Set([
    'limite_iieg',
    'limite_municipal',
    'regiones',
    'limite_inegi',
    'limite_municipal_inegi'
]);

const BACKGROUND_POLYGON_LAYER_NAMES = new Set([
    'general:cuerpos_de_agua_50k',
    'economia:cultivos',
    'recursos:areas_naturales_protegidas'
]);

export const sortItemsWithPinnedFirst = (items, pinnedSet, initialOrder) => {
    if (pinnedSet.size === 0) return items;
    const orderOf = id => {
        if (!pinnedSet.has(id)) return Infinity;
        const i = initialOrder.indexOf(id);
        return i === -1 ? initialOrder.length : i;
    };
    return [...items].sort((a, b) => orderOf(a.id) - orderOf(b.id));
};

const EMPTY_SET = new Set();

export const useAlwaysOnTopPinning = ({ activeLayerIds, hiddenLayerIds, compareModeActive }) => {
    const { layers } = useLayers();
    const debouncedActiveLayerIds = useDebounce(activeLayerIds, 30);
    const debouncedHiddenLayerIds = useDebounce(hiddenLayerIds, 30);
    const geomTypeCacheRef = useRef(new Map());
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const idsToCheck = debouncedActiveLayerIds.filter(id =>
            !ALWAYS_ON_TOP_LAYER_IDS.has(id)
            && !geomTypeCacheRef.current.has(id)
            && hasWMSConfig(id, layers)
        );
        if (idsToCheck.length === 0) return undefined;

        Promise.all(idsToCheck.map(async (id) => {
            const wmsConfig = findWMSConfig(id, layers);
            if (!wmsConfig) return;
            try {
                const type = await fetchGeometryType(wmsConfig.baseUrl, wmsConfig.layerName);
                geomTypeCacheRef.current.set(id, type);
            } catch {
                geomTypeCacheRef.current.set(id, 'unknown');
            }
        })).then(() => {
            if (!cancelled) setTick(t => t + 1);
        });

        return () => { cancelled = true; };
    }, [debouncedActiveLayerIds, layers]);

    return useMemo(() => {
        if (compareModeActive) return EMPTY_SET;

        const hiddenSet = new Set(debouncedHiddenLayerIds);
        const isBackgroundPolygon = (id) => {
            const wmsConfig = findWMSConfig(id, layers);
            return !!wmsConfig && BACKGROUND_POLYGON_LAYER_NAMES.has(wmsConfig.layerName);
        };
        const hasOtherPolygon = debouncedActiveLayerIds.some(id =>
            !ALWAYS_ON_TOP_LAYER_IDS.has(id)
            && !isBackgroundPolygon(id)
            && !hiddenSet.has(id)
            && geomTypeCacheRef.current.get(id) === 'polygon'
        );
        if (!hasOtherPolygon) return EMPTY_SET;

        const pinned = new Set();
        debouncedActiveLayerIds.forEach(id => {
            if (ALWAYS_ON_TOP_LAYER_IDS.has(id) && !hiddenSet.has(id)) {
                pinned.add(id);
            }
        });
        return pinned;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedActiveLayerIds, debouncedHiddenLayerIds, compareModeActive, tick, layers]);
};
