import { createContext, useContext } from 'react';

export const LayerLoadingContext = createContext(null);
LayerLoadingContext.displayName = 'LayerLoadingContext';

export const useLayerLoading = () => {
    const context = useContext(LayerLoadingContext);
    if (!context) throw new Error('useLayerLoading debe usarse dentro de LayerLoadingProvider');
    return context;
};
