import { createContext, useContext, useRef, useState, useLayoutEffect, useCallback, useEffect } from 'react';
import {
    SIDER_COLLAPSED_WIDTH,
    SIDER_EXPANDED_WIDTH,
    SIDER_HOVER_DELAY_ENTER,
    SIDER_HOVER_DELAY_LEAVE_DEFAULT,
    SIDER_HOVER_DELAY_LEAVE_WITH_MENU,
    SIDER_HOVER_DELAY_LEAVE_WITH_TOOLS,
    SIDER_TRANSITION_CLASSES,
    MOBILE_BREAKPOINT,
    SIDER_MOBILE_WIDTH,
} from '@constants/sider';

const SiderContext = createContext(null);

SiderContext.displayName = 'SiderContext';

export const SiderProvider = ({ children, collapsedWidth = SIDER_COLLAPSED_WIDTH, expandedWidth = SIDER_EXPANDED_WIDTH }) => {
    const siderRef = useRef(null);
    const toolsButtonRef = useRef(null);
    const [width, setWidth] = useState(collapsedWidth);
    const [isHovered, setIsHovered] = useState(false);
    const [openMenusCount, setOpenMenusCount] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const toggleSider = useCallback(() => {
        if (isMobile) {
            setIsOpen(prev => !prev);
        }
    }, [isMobile]);

    const closeSider = useCallback(() => {
        if (isMobile) {
            setIsOpen(false);
        }
    }, [isMobile]);

    const registerOpenMenu = useCallback(() => {
        setOpenMenusCount(prev => prev + 1);
    }, []);

    const unregisterOpenMenu = useCallback(() => {
        setOpenMenusCount(prev => Math.max(0, prev - 1));
    }, []);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < MOBILE_BREAKPOINT;
            setIsMobile(mobile);
            if (!mobile) {
                setIsOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile, { passive: true });
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useLayoutEffect(() => {
        if (!siderRef.current) return;

        const updateWidth = () => {
            const rect = siderRef.current.getBoundingClientRect();
            setWidth(rect.width);
        };

        updateWidth();

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateWidth);
        });

        resizeObserver.observe(siderRef.current);
        window.addEventListener('resize', updateWidth, { passive: true });

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateWidth);
        };
    }, []);

    const value = {
        siderRef,
        toolsButtonRef,
        width,
        isHovered,
        setIsHovered,
        collapsedWidth,
        expandedWidth,
        mobileWidth: SIDER_MOBILE_WIDTH,
        openMenusCount,
        registerOpenMenu,
        unregisterOpenMenu,
        isMobile,
        isOpen,
        toggleSider,
        closeSider,
    };

    return (
        <SiderContext.Provider value={value}>
            {children}
        </SiderContext.Provider>
    );
};

export const useSider = () => {
    const context = useContext(SiderContext);
    if (!context) {
        throw new Error('useSider must be used within a SiderProvider');
    }
    return context;
};

export const useSiderHover = ({
    setIsHovered,
    hasOpenMenus = false,
    hasVisibleTools = false
}) => {
    const enterTimeoutRef = useRef(null);
    const leaveTimeoutRef = useRef(null);

    const clearTimers = () => {
        if (enterTimeoutRef.current) {
            clearTimeout(enterTimeoutRef.current);
            enterTimeoutRef.current = null;
        }
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
            leaveTimeoutRef.current = null;
        }
    };

    const handleMouseEnter = () => {
        clearTimers();

        const delay = hasVisibleTools ? SIDER_HOVER_DELAY_LEAVE_WITH_TOOLS : SIDER_HOVER_DELAY_ENTER;

        enterTimeoutRef.current = setTimeout(() => {
            setIsHovered(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        clearTimers();

        let delay = SIDER_HOVER_DELAY_LEAVE_DEFAULT;
        if (hasOpenMenus) {
            delay = SIDER_HOVER_DELAY_LEAVE_WITH_MENU;
        } else if (hasVisibleTools) {
            delay = SIDER_HOVER_DELAY_LEAVE_WITH_TOOLS;
        }

        leaveTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, delay);
    };

    useEffect(() => {
        return () => clearTimers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        handleMouseEnter,
        handleMouseLeave
    };
};

export const useSiderAnchoredPosition = ({ offset = 12 } = {}) => {
    const { width } = useSider();
    const leftPosition = width + offset;

    return {
        leftPosition,
        style: { left: `${leftPosition}px` },
        className: SIDER_TRANSITION_CLASSES,
    };
};

export const useSiderAdaptivePosition = ({ bottomOffset = 60, leftOffset = 16, siderOffset = 28, anchorRef = null } = {}) => {
    const { siderRef, toolsButtonRef, width, collapsedWidth, expandedWidth } = useSider();
    const [isOverlapping, setIsOverlapping] = useState(false);
    const [topPosition, setTopPosition] = useState(null);

    const targetAnchor = anchorRef === 'tools' ? toolsButtonRef : anchorRef;

    useLayoutEffect(() => {
        const checkOverlap = () => {
            if (!siderRef.current) return;
            const siderRect = siderRef.current.getBoundingClientRect();

            if (targetAnchor?.current) {
                const anchorRect = targetAnchor.current.getBoundingClientRect();
                setTopPosition(anchorRect.top);
                setIsOverlapping(siderRect.bottom >= anchorRect.top);
            } else {
                const viewportHeight = window.innerHeight;
                const controlsTop = viewportHeight - bottomOffset;
                setIsOverlapping(siderRect.bottom >= controlsTop);
            }
        };

        checkOverlap();

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(checkOverlap);
        });

        if (siderRef.current) {
            resizeObserver.observe(siderRef.current);
        }
        if (targetAnchor?.current) {
            resizeObserver.observe(targetAnchor.current);
        }
        window.addEventListener('resize', checkOverlap, { passive: true });

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', checkOverlap);
        };
    }, [siderRef, targetAnchor, bottomOffset, collapsedWidth, expandedWidth]);

    const leftPosition = isOverlapping ? width + siderOffset : leftOffset;

    const style = topPosition !== null
        ? { left: `${leftPosition}px`, top: `${topPosition}px` }
        : { left: `${leftPosition}px` };

    return {
        isOverlapping,
        leftPosition,
        topPosition,
        style,
        className: SIDER_TRANSITION_CLASSES,
    };
};

export default SiderContext;
