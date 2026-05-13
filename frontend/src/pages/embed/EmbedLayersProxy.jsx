import { useMemo } from 'react';
import { LayersContext } from '@contexts/LayersContext';
import { useLayers } from '@hooks/useLayers';
import { proxifyLayerTree } from '@pages/embed/helpers/embedProxy';


export const EmbedLayersProxy = ({ apiKey, children }) => {
    const ctx = useLayers();
    const value = useMemo(() => {
        if (!apiKey || !ctx || !Array.isArray(ctx.layers) || ctx.layers.length === 0) {
            return ctx;
        }
        return { ...ctx, layers: proxifyLayerTree(ctx.layers, apiKey) };
    }, [ctx, apiKey]);
    return <LayersContext.Provider value={value}>{children}</LayersContext.Provider>;
};
