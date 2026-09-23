import { useCallback, useRef } from 'react';

export const useSwipeAwareFilters = ({ compareMode, applyFilter, clearFilter, applyFilterToSlot, clearFilterFromSlot }) => {
    const ref = useRef({});
    ref.current = { compareMode, applyFilter, clearFilter, applyFilterToSlot, clearFilterFromSlot };

    const applyFilterSwipeAware = useCallback((layerId, filterName, cqlExpression) => {
        const s = ref.current;
        if (s.compareMode?.active) {
            s.applyFilterToSlot(layerId, s.compareMode.activeSlot, filterName, cqlExpression);
            return;
        }
        s.applyFilter(layerId, filterName, cqlExpression);
    }, []);

    const clearFilterSwipeAware = useCallback((layerId, filterName) => {
        const s = ref.current;
        if (s.compareMode?.active) {
            s.clearFilterFromSlot(layerId, s.compareMode.activeSlot, filterName);
            return;
        }
        s.clearFilter(layerId, filterName);
    }, []);

    const applyFilterToAllSlots = useCallback((layerId, filterName, cqlExpression) => {
        const s = ref.current;
        if (!s.compareMode?.active) {
            s.applyFilter(layerId, filterName, cqlExpression);
            return;
        }
        ['A', 'B'].forEach(slot => s.applyFilterToSlot(layerId, slot, filterName, cqlExpression));
    }, []);

    return { applyFilterSwipeAware, clearFilterSwipeAware, applyFilterToAllSlots };
};
