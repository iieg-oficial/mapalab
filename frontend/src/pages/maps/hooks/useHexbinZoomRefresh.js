import { useEffect } from 'react';
import { fillHexbinLayer } from '../helpers/hexbinLayer';
import { resolutionForZoom } from '@constants/hexbin';
import { nearestPrecomputed } from '@services/hexbinAggregateService';

export const useHexbinZoomRefresh = ({ mapRef, entriesRef, usarPrecalculado, onStats }) => {
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return undefined;

        const reaggregate = async () => {
            const zoom = map.getView()?.getZoom();
            const resolution = resolutionForZoom(zoom);

            for (const [groupKey, entry] of Array.from(entriesRef.current.entries())) {
                if (!entry.hexbin) continue;

                if (entry.features) {
                    if (entry.resolucion === resolution) continue;
                    entry.resolucion = resolution;
                    onStats.current?.(entry.memberIds, fillHexbinLayer(entry.layer, entry.features, resolution));
                    continue;
                }

                if (!entry.precalculado) continue;

                const efectiva = nearestPrecomputed(resolution);
                if (!efectiva || entry.resolucion === efectiva) continue;
                entry.resolucion = efectiva;

                const controller = new AbortController();
                entry.controller = controller;
                const stats = await usarPrecalculado(groupKey, entry.memberIds, zoom, controller);
                if (stats) onStats.current?.(entry.memberIds, stats);
            }
        };

        map.on('moveend', reaggregate);
        return () => map.un('moveend', reaggregate);
    }, [mapRef, entriesRef, usarPrecalculado, onStats]);
};
