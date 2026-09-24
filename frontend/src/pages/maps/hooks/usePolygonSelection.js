import { useCallback, useRef } from 'react';
import { getFeaturesInPolygonForActiveLayers } from '@services/featureInfoService';
import { contarBorde, contarEnPoligono } from '@services/seleccionStatsService';
import { filterValidLayers } from '@utils/featureInfoUtils';
import { findWMSConfig } from '@pages/maps/helpers/wmsConfig';

export const usePolygonSelection = ({ getFilter = null, pageRef = null } = {}) => {
    const localPageRef = useRef(null);
    const polygonPageRef = pageRef || localPageRef;

    const queryPolygon = useCallback(async ({ map, polygonGeometry, activeLayers, allLayers = [], isInegiMode = false }) => {
        if (!map || !polygonGeometry || !activeLayers || activeLayers.length === 0) {
            polygonPageRef.current = null;
            return null;
        }

        const [page, enBorde] = await Promise.all([
            getFeaturesInPolygonForActiveLayers(activeLayers, map, polygonGeometry, getFilter, isInegiMode, allLayers),
            contarBorde(activeLayers, polygonGeometry, { getFilter, allLayers }),
        ]);

        polygonPageRef.current = {
            activeLayers,
            map,
            polygonGeometry,
            isInegiMode,
            allLayers,
            nextIndex: page.nextIndex,
            hasMore: page.hasMore,
            matched: page.matched
        };

        return { ...page, enBorde };
    }, [getFilter, polygonPageRef]);

    const resumirPoligono = useCallback(async ({ map, polygonGeometry, activeLayers, allLayers = [], isInegiMode = false }) => {
        const capas = !map || !polygonGeometry || !activeLayers
            ? []
            : filterValidLayers(activeLayers, allLayers, findWMSConfig).map(({ layer }) => layer);
        if (capas.length === 0) {
            polygonPageRef.current = null;
            return null;
        }

        const filas = await contarEnPoligono(
            capas.map(({ id, name, label }) => ({ id, label: label || name })),
            polygonGeometry,
            { getFilter, allLayers },
        );
        const resumen = filas
            .filter(fila => fila.conteo > 0 || (fila.conteo == null && !fila.sinWfs))
            .map(({ id, etiqueta, conteo }) => ({ layerId: id, layerName: etiqueta, conteo: conteo ?? null }));
        const matched = resumen.reduce((suma, fila) => suma + (fila.conteo || 0), 0);
        const sinDato = resumen.some(fila => fila.conteo == null);
        const enBorde = filas.reduce((suma, fila) => suma + (fila.enBorde || 0), 0);

        polygonPageRef.current = {
            activeLayers,
            map,
            polygonGeometry,
            isInegiMode,
            allLayers,
            nextIndex: 0,
            hasMore: matched > 0 || sinDato,
            matched
        };

        return { resumen, matched, enBorde };
    }, [getFilter, polygonPageRef]);

    const loadMorePage = useCallback(async () => {
        const state = polygonPageRef.current;
        if (!state || !state.hasMore || state.busy) return null;

        state.busy = true;
        try {
            const page = await getFeaturesInPolygonForActiveLayers(
                state.activeLayers, state.map, state.polygonGeometry, getFilter,
                state.isInegiMode, state.allLayers,
                { startIndex: state.nextIndex }
            );

            state.nextIndex = page.nextIndex;
            state.hasMore = page.hasMore;
            return page;
        } catch {
            state.hasMore = false;
            return null;
        } finally {
            state.busy = false;
        }
    }, [getFilter, polygonPageRef]);

    const clearPolygonPage = useCallback(() => {
        polygonPageRef.current = null;
    }, [polygonPageRef]);

    return { polygonPageRef, queryPolygon, resumirPoligono, loadMorePage, clearPolygonPage };
};
