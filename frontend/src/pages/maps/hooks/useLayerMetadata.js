import { useState, useEffect, useMemo, useRef } from 'react';
import { getLayerMetadata, buildMetadataContextKey } from '@services/layerMetadataService';

export const useLayerMetadata = (layerId, context = null) => {
    const contextKey = buildMetadataContextKey(context);
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(Boolean(layerId));
    const [error, setError] = useState(null);
    const prevIdRef = useRef(`${layerId}#${contextKey}`);

    if (prevIdRef.current !== `${layerId}#${contextKey}`) {
        prevIdRef.current = `${layerId}#${contextKey}`;
        if (layerId) {
            setLoading(true);
            setMetadata(null);
            setError(null);
        } else {
            setLoading(false);
            setMetadata(null);
            setError(null);
        }
    }

    useEffect(() => {
        if (!layerId) return;

        let cancelled = false;
        getLayerMetadata(layerId, context)
            .then(data => { if (!cancelled) setMetadata(data); })
            .catch(err => { if (!cancelled) setError(err.message || 'Error al cargar metadata'); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layerId, contextKey]);

    return { metadata, loading, error };
};

export const useMetadataContext = (municipioMode) => {
    const claves = municipioMode?.municipioContext?.active
        ? municipioMode.municipioContext.claves
        : null;

    return useMemo(() => (claves?.length ? { claves } : null), [claves]);
};
