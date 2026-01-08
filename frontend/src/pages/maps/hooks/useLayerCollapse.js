import { useState, useEffect } from 'react';
import { MOBILE_BREAKPOINT } from '@constants/sider';

export const useLayerCollapse = (unifiedLayers) => {
    const [isCollapsed, setIsCollapsed] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);
    const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

    useEffect(() => {
        if (unifiedLayers.length === 0 && !isManuallyCollapsed) {
            setIsCollapsed(true);
        } else if (isCollapsed && unifiedLayers.length > 0 && !isManuallyCollapsed) {
            setIsCollapsed(false);
        }
    }, [unifiedLayers.length, isCollapsed, isManuallyCollapsed]);

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