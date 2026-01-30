import { useMemo, useCallback, useRef, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useSider, useSiderHover } from '@contexts/SiderContext';
import { useOutsideClick } from '@hooks/useOutsideClick';
import { useScrollOverflow } from '@hooks/useScrollOverflow';
import Panel from '@components/Panel';
import MobileMenu from './MobileMenu';
import Logo from '@components/Logo';
import { createMenuItems } from '@pages/maps/helpers/menuItems';
import { SIDER_TRANSITION_TIMING } from '@constants/sider';
import { HIDDEN_SCROLLBAR } from '@constants/global';

import { useZenMode } from './ZenMode';

const MapSider = ({ className = '' }) => {
    const {
        activeLayerIds: contextActiveLayerIds,
        onToggleLayer,
        toggleMeasurementTools,
        areMeasurementToolsVisible,
        loadingLayers,
        isLocating
    } = useMapsContext();
    const isLoading = loadingLayers.size > 0 || isLocating;
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
    const { isZenMode } = useZenMode();
    const contentRef = useRef(null);
    const { canScrollUp, canScrollDown } = useScrollOverflow(contentRef);

    const treatAsMobile = isMobile || isZenMode;

    const { handleMouseEnter, handleMouseLeave } = useSiderHover({
        setIsHovered,
        hasOpenMenus: openMenusCount > 0,
        hasVisibleTools: areMeasurementToolsVisible
    });

    useOutsideClick([siderRef], () => {
        if (treatAsMobile && isOpen && openMenusCount === 0) {
            closeSider();
        }
    });

    const computeWidth = () => {
        if (treatAsMobile) {
            return isOpen ? expandedWidth : mobileWidth;
        }
        return isHovered ? expandedWidth : collapsedWidth;
    };

    const width = computeWidth();
    const isExpanded = treatAsMobile ? isOpen : isHovered;

    const menuItems = useMemo(() =>
        createMenuItems({ isHovered: isExpanded, activeLayerIds: contextActiveLayerIds, onToggleLayer, toggleMeasurementTools, toolsButtonRef, areMeasurementToolsVisible }),
        [isExpanded, contextActiveLayerIds, onToggleLayer, toggleMeasurementTools, toolsButtonRef, areMeasurementToolsVisible]);

    const MenuItem = useCallback(({ item, isMobileView }) => {
        const [isMenuOpen, setIsMenuOpen] = useState(false);
        const buttonRef = useRef(null);

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

            const handleClose = () => setIsMenuOpen(false);

            return (
                <>
                    <button
                        type="button"
                        ref={buttonRef}
                        id={`menu-button-${item.id}`}
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        aria-controls={`menu-content-${item.id}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="cursor-pointer w-full text-left"
                    >
                        {item.renderComponent ? item.renderComponent({ isMenuOpen }) : item.component}
                    </button>
                    {isMobileView ? (
                        <MobileMenu
                            open={isMenuOpen}
                            onClose={handleClose}
                            registerInSider={true}
                        >
                            {item.menuContent({ close: handleClose })}
                        </MobileMenu>
                    ) : (
                        <Panel
                            open={isMenuOpen}
                            onClose={handleClose}
                            anchorRef={buttonRef}
                            variant="menu"
                            role="menu"
                            closeOnEscape={true}
                            autoFocus={true}
                            registerInSider={true}
                            width="w-88"
                            maxHeight="max-h-200"
                            noPadding={true}
                            className="border-none"
                            shadow="shadow-none"
                            offset={10}
                            rounded="rounded-r-2xl"
                            bg="bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A]"
                        >
                            {item.menuContent({ close: handleClose })}
                        </Panel>
                    )}
                </>
            );
        } catch (error) {
            console.error('Error rendering menu item:', error);
            return null;
        }
    }, []);

    const handleLogoClick = () => {
        if (treatAsMobile) {
            toggleSider();
        }
    };

    const sizeLogo = {
        expanded: 'w-57 h-17',
        collapsed: 'w-14 h-17',
        loading: 'w-14 h-17'
    }
    return (
        <aside
            ref={siderRef}
            className={[
                'absolute top-4 left-4 z-20 flex flex-col',
                'max-h-[calc(100vh-2rem)] bg-white shadow-[0_5px_20px_#1A26641A] rounded-[10px]',
                'transition-all duration-500',
                className,
            ].join(' ')}
            style={{
                transitionTimingFunction: SIDER_TRANSITION_TIMING,
                width: `${width}px`
            }}
            onMouseEnter={!treatAsMobile ? handleMouseEnter : undefined}
            onMouseLeave={!treatAsMobile ? handleMouseLeave : undefined}
        >
            <div
                className={`shrink-0 p-3 flex justify-center ${treatAsMobile ? 'cursor-pointer' : ''}`}
                onClick={handleLogoClick}
            >
                <Logo
                    name="mapalab"
                    size={sizeLogo[isLoading ? 'loading' : isExpanded ? 'expanded' : 'collapsed']}
                    expanded={isExpanded}
                    isLoading={isLoading}
                />
            </div>

            {(!treatAsMobile || isOpen) && (
                <div
                    ref={contentRef}
                    className={[
                        'flex-1 flex flex-col gap-3 px-3',
                        `${HIDDEN_SCROLLBAR}`,
                        canScrollUp && canScrollDown
                            ? '[mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]'
                            : canScrollUp
                                ? '[mask-image:linear-gradient(to_bottom,transparent_0%,black_10%)]'
                                : canScrollDown
                                    ? '[mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]'
                                    : ''
                    ].join(' ')}
                >
                    <div className="bg-[#F9FBFF] rounded-[8px] py-2 flex flex-col gap-3">
                        {menuItems.slice(0, 3).map((item, index) => (
                            <div
                                key={item.id || index}
                                className={`transition-opacity duration-500 w-full shrink-0 overflow-x-hidden`}
                                title={item.tooltip}
                            >
                                <MenuItem item={item} isMobileView={treatAsMobile} />
                            </div>
                        ))}
                    </div>
                    {menuItems.slice(3).map((item, index) => (
                        <div
                            key={item.id || index}
                            className={`transition-opacity duration-500 w-full shrink-0 overflow-x-hidden`}
                            title={item.tooltip}
                        >
                            <MenuItem item={item} isMobileView={treatAsMobile} />
                        </div>
                    ))}
                </div>
            )}

            {(!treatAsMobile || isOpen) && (
                <div className="shrink-0 p-3 my-2 flex justify-center">
                    <Logo name="iieg" size={isExpanded ? 'w-41 h-13' : 'w-12 h-13'} expanded={isExpanded} />
                </div>
            )}
        </aside>
    );
};

export default MapSider;
