import { createContext, useContext, useCallback, useState, useMemo } from 'react';

const LayerLoadingContext = createContext(null);

LayerLoadingContext.displayName = 'LayerLoadingContext';

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

export const useLayerLoading = () => {
    const context = useContext(LayerLoadingContext);
    if (!context) throw new Error('useLayerLoading debe usarse dentro de LayerLoadingProvider');
    return context;
};
