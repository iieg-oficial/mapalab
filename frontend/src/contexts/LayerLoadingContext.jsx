import { useCallback, useState, useMemo } from 'react';
import { LayerLoadingContext } from '@hooks/useLayerLoading';

export const LayerLoadingProvider = ({ children }) => {
    const [loadingLayers, setLoadingLayers] = useState(new Set());

    const setLayerLoading = useCallback((layerId, isLoading) => {
        setLoadingLayers(prev => {
            const newSet = new Set(prev);
            if (isLoading) {
                newSet.add(layerId);
            } else {
                newSet.delete(layerId);
            }
            return newSet;
        });
    }, []);

    const value = useMemo(() => ({
        loadingLayers,
        setLayerLoading
    }), [loadingLayers, setLayerLoading]);

    return (
        <LayerLoadingContext.Provider value={value}>
            {children}
        </LayerLoadingContext.Provider>
    );
};
