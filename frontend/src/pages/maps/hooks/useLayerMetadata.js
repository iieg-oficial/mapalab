import { useState, useEffect, useRef } from 'react';
import { getLayerMetadata } from '@services/layerMetadataService';

export const useLayerMetadata = (layerId) => {
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(Boolean(layerId));
    const [error, setError] = useState(null);
    const prevIdRef = useRef(layerId);

    if (prevIdRef.current !== layerId) {
        prevIdRef.current = layerId;
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
        getLayerMetadata(layerId)
            .then(data => { if (!cancelled) setMetadata(data); })
            .catch(err => { if (!cancelled) setError(err.message || 'Error al cargar metadata'); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [layerId]);

    return { metadata, loading, error };
};
