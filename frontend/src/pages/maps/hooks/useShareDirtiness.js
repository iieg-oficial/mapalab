import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { useMapsContext } from '@hooks/useMaps';

export const useShareDirtiness = () => {
    const { activeLayerIds, filters, layerOpacities, hiddenLayerIds, selectedLayerForSymbology, baseMapId } = useMapsContext();
    const [searchParams] = useSearchParams();
    const loadedShareId = searchParams.get('s');

    const [isDirty, setIsDirty] = useState(false);
    const settledRef = useRef(false);
    const lastShareIdRef = useRef(null);

    if (lastShareIdRef.current !== loadedShareId) {
        lastShareIdRef.current = loadedShareId;
        settledRef.current = false;
        if (isDirty) setIsDirty(false);
    }

    useEffect(() => {
        if (!loadedShareId) return;
        if (!Array.isArray(activeLayerIds) || activeLayerIds.length === 0) return;
        if (!settledRef.current) {
            settledRef.current = true;
            return;
        }
        if (!isDirty) setIsDirty(true);
    }, [activeLayerIds, filters, layerOpacities, hiddenLayerIds, selectedLayerForSymbology, baseMapId, loadedShareId, isDirty]);

    const reset = useCallback(() => {
        setIsDirty(false);
        settledRef.current = true;
    }, []);

    return {
        loadedShareId,
        isDirty: isDirty && !!loadedShareId,
        reset,
    };
};
