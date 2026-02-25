import { useState, useEffect } from 'react';
import { getLayerMetadata } from '@services/layerMetadataService';

export const useLayerMetadata = (layerId) => {
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(Boolean(layerId));
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!layerId) {
            setMetadata(null);
            setError(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        let cancelled = false;
        getLayerMetadata(layerId)
            .then(data => { if (!cancelled) setMetadata(data); })
            .catch(err => { if (!cancelled) setError(err.message || 'Error al cargar metadata'); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [layerId]);

    return { metadata, loading, error };
};
