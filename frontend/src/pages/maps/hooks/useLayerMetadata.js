import { useState, useEffect } from 'react';
import { getLayerMetadata } from '@services/layerMetadataService';

export const useLayerMetadata = (layerId) => {
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!layerId) {
            setMetadata(null);
            setError(null);
            return;
        }

        const fetchMetadata = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await getLayerMetadata(layerId);
                setMetadata(data);
            } catch (err) {
                setError(err.message || 'Error al cargar metadata');
                setMetadata(null);
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
    }, [layerId]);

    return { metadata, loading, error };
};
