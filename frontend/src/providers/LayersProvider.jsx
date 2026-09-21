import { useCallback, useEffect, useMemo, useState } from 'react';
import LottieSpinner from '@components/LottieSpinner';
import { LayersContext } from '@contexts/LayersContext';
import ErrorPage from '@pages/ErrorPage';
import { fetchLayerTree, fetchInitialOrder } from '@services/layerTreeService';
import { setLayersForMetadataService } from '@services/layerMetadataService';
import { setLayersForDownloadService } from '@services/downloadService';
import { rebuildSearchConfig } from '@services/searchConfig';
import { reportClientError } from '@services/clientErrorService';
import { hydrateLayerTree } from '@pages/maps/helpers/wmsConfig';
import { fillRasterPeriodicity } from '@pages/maps/helpers/layers/utils/rasterPeriodicityFallback';


export const LayersProvider = ({ children }) => {
    const [attempt, setAttempt] = useState(0);
    const [state, setState] = useState({
        layers: [],
        initialOrder: [],
        loading: true,
        error: null,
    });

    const retry = useCallback(() => {
        setState((s) => ({ ...s, loading: true, error: null }));
        setAttempt((n) => n + 1);
    }, []);

    useEffect(() => {
        let cancelled = false;

        let hydrated = null;

        Promise.all([fetchLayerTree(), fetchInitialOrder()])
            .then(([{ tree }, order]) => {
                if (cancelled) return null;
                hydrated = hydrateLayerTree(tree);
                setLayersForMetadataService(hydrated);
                setLayersForDownloadService(hydrated);
                rebuildSearchConfig(hydrated);
                setState({ layers: hydrated, initialOrder: order, loading: false, error: null });
                return fillRasterPeriodicity(hydrated).catch(() => hydrated);
            })
            .then((filled) => {
                if (cancelled || !filled || filled === hydrated) return;
                setLayersForMetadataService(filled);
                setLayersForDownloadService(filled);
                setState((s) => ({ ...s, layers: filled }));
            })
            .catch((err) => {
                if (cancelled) return;
                console.error('[LayersProvider] fetch fallo:', err);
                reportClientError({
                    type: 'layer_tree_error',
                    message: err?.message || String(err),
                });
                setState((s) => ({ ...s, loading: false, error: err }));
            });

        return () => {
            cancelled = true;
        };
    }, [attempt]);

    const value = useMemo(() => state, [state]);

    if (state.loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LottieSpinner loop autoplay className="w-32 h-32" />
            </div>
        );
    }

    if (state.error) {
        return (
            <ErrorPage
                title="No se pudo cargar el visor"
                description={'No fue posible obtener las capas desde el servidor.\nRevisa tu conexión e intenta de nuevo.'}
                onRetry={retry}
            />
        );
    }

    return (
        <LayersContext.Provider value={value}>
            {children}
        </LayersContext.Provider>
    );
};
