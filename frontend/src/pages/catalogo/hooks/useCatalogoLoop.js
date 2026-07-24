import { useCallback, useMemo, useState } from 'react';
import { useDateLoop } from '@hooksMaps/useDateLoop';
import { buildLoopValues } from '@pages/maps/helpers/dateLoopHelpers';

export const useCatalogoLoop = (tiempo) => {
    const { layerId, periodicidad, isRaster, hasPeriodicidad, applyFilter, clearFilter, getSpecificFilter, getPeriodicity } = tiempo;
    const [expandedYear, setExpandedYear] = useState(null);

    const loopSource = isRaster
        ? { rasterPeriodicity: periodicidad }
        : { periodicity: periodicidad };

    const activeLayerIds = useMemo(() => (layerId ? [layerId] : []), [layerId]);

    const loop = useDateLoop({
        applyFilter,
        clearFilter,
        activeLayerIds,
        getSpecificFilter,
        getPeriodicity,
    });

    const { getLoopState, startLoop, toggleLoop, stopLoop, inferLoopConfig } = loop;

    const viewLoopConfig = useCallback(() => {
        if (!layerId || !hasPeriodicidad) return null;
        if (expandedYear != null) {
            const values = buildLoopValues({ mode: 'month', year: expandedYear, ...loopSource });
            return values.length >= 2 ? { mode: 'month', year: expandedYear, values } : null;
        }
        const values = buildLoopValues({ mode: 'year', ...loopSource });
        return values.length >= 2 ? { mode: 'year', values } : null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layerId, hasPeriodicidad, expandedYear, periodicidad, isRaster]);

    const loopState = layerId ? getLoopState?.(layerId) : null;
    const canPlay = !!layerId && (!!loopState || viewLoopConfig() != null || inferLoopConfig?.(layerId) != null);

    const onToggleLoop = useCallback(() => {
        if (!layerId) return;
        if (loopState?.isPlaying) {
            stopLoop?.(layerId);
            return;
        }
        const desiredMode = expandedYear != null ? 'month' : 'year';
        if (loopState && loopState.mode === desiredMode) {
            toggleLoop?.(layerId);
            return;
        }
        if (loopState) stopLoop?.(layerId);
        const config = viewLoopConfig() || inferLoopConfig?.(layerId);
        if (config) startLoop?.(layerId, config);
    }, [layerId, loopState, expandedYear, viewLoopConfig, inferLoopConfig, startLoop, stopLoop, toggleLoop]);

    return {
        ...loop,
        canPlay,
        isLoopPlaying: loopState?.isPlaying ?? false,
        onToggleLoop,
        expandedYear,
        setExpandedYear,
    };
};
