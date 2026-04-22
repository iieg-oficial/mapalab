import { useEffect, useMemo, useState } from 'react';
import LottieSpinner from '@components/LottieSpinner';
import { LayersContext } from '@contexts/LayersContext';
import { fetchLayerTree, fetchInitialOrder } from '@services/layerTreeService';
import { setLayersForMetadataService } from '@services/layerMetadataService';
import { setLayersForDownloadService } from '@services/downloadService';
import { rebuildSearchConfig } from '@services/searchConfig';
import { hydrateLayerTree } from '@pages/maps/helpers/wmsConfig';


export const LayersProvider = ({ children }) => {
    const [state, setState] = useState({
        layers: [],
        initialOrder: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        let cancelled = false;

        Promise.all([fetchLayerTree(), fetchInitialOrder()])
            .then(([{ tree }, order]) => {
                if (cancelled) return;
                const hydrated = hydrateLayerTree(tree);
                setLayersForMetadataService(hydrated);
                setLayersForDownloadService(hydrated);
                rebuildSearchConfig(hydrated);
                setState({ layers: hydrated, initialOrder: order, loading: false, error: null });
            })
            .catch((err) => {
                if (cancelled) return;
                console.error('[LayersProvider] fetch fallo:', err);
                setState((s) => ({ ...s, loading: false, error: err }));
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const value = useMemo(() => state, [state]);

    if (state.loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <LottieSpinner />
            </div>
        );
    }

    if (state.error) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
                <div style={{ maxWidth: 480, textAlign: 'center' }}>
                    <h2>No se pudo cargar el visor</h2>
                    <p>No fue posible obtener las capas desde el servidor. Intenta recargar la página.</p>
                </div>
            </div>
        );
    }

    return (
        <LayersContext.Provider value={value}>
            {children}
        </LayersContext.Provider>
    );
};
