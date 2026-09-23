import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDateLoop } from '@hooksMaps/useDateLoop';
import { buildLoopValues } from '@pages/maps/helpers/dateLoopHelpers';

export const useCatalogoLoop = (tiempo) => {
    const { layerId, periodicidad, isRaster, hasPeriodicidad, applyFilter, clearFilter, getSpecificFilter, getPeriodicity } = tiempo;
    const [expandedYear, setExpandedYear] = useState(null);

    useEffect(() => {
        setExpandedYear(null);
    }, [layerId]);

    const activeLayerIds = useMemo(() => (layerId ? [layerId] : []), [layerId]);

    const getRasterPeriodicity = useCallback(
        (id) => (id === layerId && isRaster ? periodicidad : null),
        [layerId, isRaster, periodicidad],
    );

    const loop = useDateLoop({
        applyFilter,
        clearFilter,
        activeLayerIds,
        getSpecificFilter,
        getPeriodicity,
        getRasterPeriodicity,
    });

    const { getLoopState, toggleLoop, inferLoopConfig } = loop;

    const viewLoopConfig = useCallback(() => {
        if (!layerId || !hasPeriodicidad) return null;
        const loopSource = isRaster ? { rasterPeriodicity: periodicidad } : { periodicity: periodicidad };
        if (expandedYear != null) {
            const values = buildLoopValues({ mode: 'month', year: expandedYear, ...loopSource });
            return values.length >= 2 ? { mode: 'month', year: expandedYear, values } : null;
        }
        const values = buildLoopValues({ mode: 'year', ...loopSource });
        return values.length >= 2 ? { mode: 'year', values } : null;
    }, [layerId, hasPeriodicidad, expandedYear, periodicidad, isRaster]);

    const loopState = layerId ? getLoopState?.(layerId) : null;
    const canPlay = !!layerId && (!!loopState || viewLoopConfig() != null || inferLoopConfig?.(layerId) != null);

    const onToggleLoop = useCallback(() => {
        if (!layerId) return;
        toggleLoop?.(layerId, viewLoopConfig());
    }, [layerId, viewLoopConfig, toggleLoop]);

    return {
        ...loop,
        canPlay,
        isLoopPlaying: loopState?.isPlaying ?? false,
        onToggleLoop,
        expandedYear,
        setExpandedYear,
    };
};
