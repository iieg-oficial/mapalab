import { useState, useCallback, useEffect, useRef } from 'react';

export const useAccordion = (items = [], initialExpandedIndex = 0) => {
    const [expandedIndex, setExpandedIndex] = useState(initialExpandedIndex);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (items.length > 0 && expandedIndex === null && isFirstRender.current) {
            setExpandedIndex(0);
        }
        isFirstRender.current = false;
    }, [items.length, expandedIndex]);

    const toggleItem = useCallback((index) => {
        setExpandedIndex(prev => prev === index ? null : index);
    }, []);

    const expandItem = useCallback((index) => {
        setExpandedIndex(index);
    }, []);

    const collapseAll = useCallback(() => {
        setExpandedIndex(null);
    }, []);

    const isExpanded = useCallback((index) => {
        return expandedIndex === index;
    }, [expandedIndex]);

    return {
        expandedIndex,
        toggleItem,
        expandItem,
        collapseAll,
        isExpanded
    };
};
