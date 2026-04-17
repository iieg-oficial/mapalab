import { useState, useEffect } from 'react';
import { MOBILE_BREAKPOINT } from '@constants/sider';
import { useZenMode } from '../../ZenMode';

export const useLayerCollapse = (unifiedLayers) => {
    const [isCollapsed, setIsCollapsed] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
    const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
    const { isZenMode } = useZenMode();

    useEffect(() => {
        if (isZenMode) {
            setIsCollapsed(true);
            setIsManuallyCollapsed(true);
        } else if (isCollapsed && unifiedLayers.length > 0 && !isManuallyCollapsed) {
            setIsCollapsed(false);
        }
    }, [unifiedLayers.length, isCollapsed, isManuallyCollapsed, isZenMode]);

    const handleManualCollapse = () => {
        setIsCollapsed(true);
        setIsManuallyCollapsed(true);
    };

    const handleExpand = () => {
        setIsCollapsed(false);
        setIsManuallyCollapsed(false);
    };

    return {
        isCollapsed,
        isManuallyCollapsed,
        handleManualCollapse,
        handleExpand,
    };
};
