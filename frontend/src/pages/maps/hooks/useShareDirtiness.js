import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { useMapsContext } from '@hooks/useMaps';

const GRACE_MS = 500;

export const useShareDirtiness = () => {
    const { activeLayerIds, filters, layerOpacities, hiddenLayerIds, selectedLayerForSymbology, baseMapId } = useMapsContext();
    const [searchParams] = useSearchParams();
    const loadedShareId = searchParams.get('s');

    const [isDirty, setIsDirty] = useState(false);
    const graceUntilRef = useRef(0);
    const lastShareIdRef = useRef(null);
    const pendingResetRef = useRef(false);

    if (lastShareIdRef.current !== loadedShareId) {
        lastShareIdRef.current = loadedShareId;
        pendingResetRef.current = true;
        if (isDirty) setIsDirty(false);
    }

    useEffect(() => {
        if (pendingResetRef.current) {
            pendingResetRef.current = false;
            graceUntilRef.current = Date.now() + GRACE_MS;
        }
    }, [loadedShareId]);

    useEffect(() => {
        if (!loadedShareId) return;
        if (!Array.isArray(activeLayerIds) || activeLayerIds.length === 0) return;
        if (Date.now() < graceUntilRef.current) return;
        if (!isDirty) setIsDirty(true);
    }, [activeLayerIds, filters, layerOpacities, hiddenLayerIds, selectedLayerForSymbology, baseMapId, loadedShareId, isDirty]);

    const reset = useCallback(() => {
        setIsDirty(false);
        graceUntilRef.current = Date.now() + GRACE_MS;
    }, []);

    const markPending = useCallback(() => {
        graceUntilRef.current = 0;
        setIsDirty(false);
    }, []);

    return {
        loadedShareId,
        isDirty: isDirty && !!loadedShareId,
        reset,
        markPending,
    };
};
