import { useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useSider, useSiderHover } from '@contexts/SiderContext';
import { useOutsideClick } from '@hooks/useOutsideClick';
import FloatingMenu from '@components/FloatingMenu';
import Logo from '@components/Logo';
import { createMenuItems } from '@pages/maps/helpers/menuItems';
import { SIDER_TRANSITION_TIMING } from '@constants/sider';

const MapSider = ({ className = '' }) => {
    const {
        activeLayerIds: contextActiveLayerIds,
        onToggleLayer,
        toggleMeasurementTools,
        areMeasurementToolsVisible
    } = useMapsContext();
    const {
        siderRef,
        toolsButtonRef,
        isHovered,
        setIsHovered,
        collapsedWidth,
        expandedWidth,
        mobileWidth,
        openMenusCount,
        isMobile,
        isOpen,
        toggleSider,
        closeSider
    } = useSider();
    const [scrollState, setScrollState] = useState({ canScrollUp: false, canScrollDown: false });
    const contentRef = useRef(null);

    const { handleMouseEnter, handleMouseLeave } = useSiderHover({
        setIsHovered,
        hasOpenMenus: openMenusCount > 0,
        hasVisibleTools: areMeasurementToolsVisible
    });

    useOutsideClick([siderRef], () => {
        if (isMobile && isOpen) {
            closeSider();
        }
    });

    const computeWidth = () => {
        if (isMobile) {
            return isOpen ? expandedWidth : mobileWidth;
        }
        return isHovered ? expandedWidth : collapsedWidth;
    };

    const width = computeWidth();
    const isExpanded = isMobile ? isOpen : isHovered;

    const menuItems = useMemo(() =>
        createMenuItems({ isHovered: isExpanded, activeLayerIds: contextActiveLayerIds, onToggleLayer, toggleMeasurementTools, toolsButtonRef }),
        [isExpanded, contextActiveLayerIds, onToggleLayer, toggleMeasurementTools, toolsButtonRef]);

    const renderMenuItem = useCallback((item) => {
        try {
            if (!item.hasMenu) {
                if (item.onClick) {
                    return (
                        <div ref={item.ref} onClick={item.onClick} className="cursor-pointer">
                            {item.component}
                        </div>
                    );
                }
                return item.component;
            }

            return (
                <FloatingMenu
                    placement="right-start"
                    trigger={({ ref, props }) => (
                        <div ref={ref} {...props}>
                            {item.component}
                        </div>
                    )}
                >
                    {(api) => item.menuContent(api)}
                </FloatingMenu>
            );
        } catch (error) {
            console.error('Error rendering menu item:', error);
            return null;
        }
    }, []);

    const checkScroll = useCallback(() => {
        if (contentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            setScrollState({
                canScrollUp: scrollTop > 0,
                canScrollDown: scrollTop + clientHeight < scrollHeight - 1
            });
        }
    }, []);

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [checkScroll]);

    const handleLogoClick = () => {
        if (isMobile) {
            toggleSider();
        }
    };

    return (
        <aside
            ref={siderRef}
            className={[
                'absolute top-4 left-4 z-20',
                'max-h-[calc(100vh-2rem)]',
                'backdrop-blur bg-white/80',
                'border border-black/10 shadow-2xl',
                'rounded-2xl',
                'transition-all duration-500',
                'flex flex-col',
                className,
            ].join(' ')}
            style={{
                transitionTimingFunction: SIDER_TRANSITION_TIMING,
                width: `${width}px`
            }}
            onMouseEnter={!isMobile ? handleMouseEnter : undefined}
            onMouseLeave={!isMobile ? handleMouseLeave : undefined}
        >
            <div
                className={`shrink-0 p-3 flex justify-center ${isMobile ? 'cursor-pointer' : ''}`}
                onClick={handleLogoClick}
            >
                <Logo name="mapalab" size={isExpanded ? 'w-57 h-17' : 'w-14 h-17'} className="transition-all duration-500" expanded={isExpanded} />
            </div>

            {(!isMobile || isOpen) && (
                <div
                    ref={contentRef}
                    className={[
                        'flex-1 flex flex-col gap-1 px-2',
                        'overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]',
                        scrollState.canScrollUp && scrollState.canScrollDown
                            ? '[mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]'
                            : scrollState.canScrollUp
                                ? '[mask-image:linear-gradient(to_bottom,transparent_0%,black_10%)]'
                                : scrollState.canScrollDown
                                    ? '[mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]'
                                    : ''
                    ].join(' ')}
                    onScroll={checkScroll}
                >
                    {menuItems.map((item, index) => (
                        <div
                            key={item.id || index}
                            className={[
                                'transition-opacity duration-500',
                                'w-full shrink-0',
                                'overflow-x-hidden'
                            ].join(' ')}
                            style={{ transitionTimingFunction: SIDER_TRANSITION_TIMING }}
                            title={!isExpanded ? item.tooltip : undefined}
                        >
                            {renderMenuItem(item)}
                        </div>
                    ))}
                </div>
            )}

            {(!isMobile || isOpen) && (
                <div className="shrink-0 p-3 my-2 flex justify-center">
                    <Logo name="iieg" size={isExpanded ? 'w-41 h-13' : 'w-12 h-13'} className="transition-all duration-500" expanded={isExpanded} />
                </div>
            )}
        </aside>
    );
};

export default MapSider;