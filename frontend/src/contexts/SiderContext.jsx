/* eslint-disable react-refresh/only-export-components */
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
    SIDER_LOCK_MODES,
} from '@constants/sider';
import { leerCandado, guardarCandado } from '@utils/siderPersistencia';

export const SiderContext = createContext(null);

SiderContext.displayName = 'SiderContext';

export const SiderProvider = ({ children, collapsedWidth = SIDER_COLLAPSED_WIDTH, expandedWidth = SIDER_EXPANDED_WIDTH }) => {
    const siderRef = useRef(null);
    const toolsButtonRef = useRef(null);
    const toolsPanelRef = useRef(null);
    const [width, setWidth] = useState(collapsedWidth);
    const [isHovered, setIsHovered] = useState(false);
    const [openMenusCount, setOpenMenusCount] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [lockMode, setLockMode] = useState(leerCandado);
    const [hoverLockCount, setHoverLockCount] = useState(0);
    const [candadoForzado, forzarCandado] = useState(null);
    const candado = candadoForzado || lockMode;

    useEffect(() => { guardarCandado(lockMode); }, [lockMode]);

    const seAbreConClic = isMobile || candado === 'mobile';

    const toggleSider = useCallback(() => {
        if (seAbreConClic) {
            setIsOpen(prev => !prev);
        }
    }, [seAbreConClic]);

    const closeSider = useCallback(() => {
        if (seAbreConClic) {
            setIsOpen(false);
        }
    }, [seAbreConClic]);

    const setLock = useCallback((mode) => {
        if (!SIDER_LOCK_MODES.includes(mode)) return;
        setIsHovered(mode === 'expanded');
        setLockMode(mode);
    }, []);

    const toggleLock = useCallback(() => {
        setLockMode(prev => {
            const next = SIDER_LOCK_MODES[(SIDER_LOCK_MODES.indexOf(prev) + 1) % SIDER_LOCK_MODES.length];
            setIsHovered(next === 'expanded');
            return next;
        });
    }, []);

    const lockHover = useCallback(() => {
        setHoverLockCount(prev => prev + 1);
    }, []);

    const unlockHover = useCallback(() => {
        setHoverLockCount(prev => Math.max(0, prev - 1));
    }, []);

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
        toolsPanelRef,
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
        lockMode: candado,
        forzarCandado,
        toggleSider,
        closeSider,
        toggleLock,
        setLockMode,
        setLock,
        hoverLocked: hoverLockCount > 0,
        lockHover,
        unlockHover,
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
    hasVisibleTools = false,
    hoverLocked = false,
    lockMode = 'auto'
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
        if (hoverLocked) return;
        if (lockMode === 'collapsed' || lockMode === 'mobile') return;

        clearTimers();

        const delay = hasVisibleTools ? SIDER_HOVER_DELAY_LEAVE_WITH_TOOLS : SIDER_HOVER_DELAY_ENTER;

        enterTimeoutRef.current = setTimeout(() => {
            setIsHovered(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (lockMode === 'expanded') return;

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
        if (hoverLocked) clearTimers();
    }, [hoverLocked]);

    useEffect(() => {
        return () => clearTimers();

    }, []);

    return {
        handleMouseEnter,
        handleMouseLeave
    };
};

export const useSiderAdaptivePosition = ({ bottomOffset = 60, leftOffset = 16, siderOffset = 28, anchorRef = null } = {}) => {
    const { siderRef, toolsButtonRef, width, collapsedWidth, expandedWidth, isMobile, isOpen } = useSider();
    const [isOverlapping, setIsOverlapping] = useState(false);
    const [topPosition, setTopPosition] = useState(null);

    const targetAnchor = anchorRef === 'tools' ? toolsButtonRef : anchorRef;
    const isMobileCollapsed = isMobile && !isOpen && anchorRef != null;

    useLayoutEffect(() => {
        const checkOverlap = () => {
            if (!siderRef.current) return;
            const siderRect = siderRef.current.getBoundingClientRect();

            if (isMobileCollapsed) {
                setTopPosition(siderRect.bottom + 20);
                setIsOverlapping(false);
            } else if (targetAnchor?.current) {
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
    }, [siderRef, targetAnchor, bottomOffset, collapsedWidth, expandedWidth, isMobileCollapsed]);

    const leftPosition = isMobileCollapsed
        ? leftOffset
        : isOverlapping ? width + siderOffset : leftOffset;

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
