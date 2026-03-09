import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useMapsContext } from '@hooks/useMaps';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { useSider, useSiderHover } from '@contexts/SiderContext';
import { useSearch } from '@contexts/SearchContext';
import { useOutsideClick } from '@hooks/useOutsideClick';
import { useScrollOverflow } from '@hooks/useScrollOverflow';
import Logo from '@components/Logo';
import { createMenuItems } from '@pages/maps/helpers/menuItems';
import { SIDER_TRANSITION_TIMING } from '@constants/sider';
import { HIDDEN_SCROLLBAR } from '@constants/global';

import { trackSiderLock } from '@services/analyticsService';
import { useZenMode } from './ZenMode';

import MenuItem from './MenuItem';

const MapSider = ({ className = '' }) => {
    const {
        activeLayerIds: contextActiveLayerIds,
        onToggleLayer,
        toggleMeasurementTools,
        areMeasurementToolsVisible,
        isLocating,
        rasterLoops
    } = useMapsContext();
    const { loadingLayers } = useLayerLoading();
    const hasNonLoopLoading = [...loadingLayers].some(id => !rasterLoops[id]?.isPlaying);
    const isLoading = hasNonLoopLoading || isLocating;
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
        closeSider,
        lockMode,
        toggleLock
    } = useSider();
    const handleToggleLock = useCallback(() => {
        const nextModeLabel = lockMode === 'auto' ? 'expandido' : lockMode === 'expanded' ? 'colapsado' : 'automatico';
        trackSiderLock(nextModeLabel);
        toggleLock();
    }, [lockMode, toggleLock]);

    const { shouldAutoOpenSearch, clearAutoOpen } = useSearch();
    const { isZenMode } = useZenMode();
    const contentRef = useRef(null);
    const { canScrollUp, canScrollDown } = useScrollOverflow(contentRef);
    const [autoOpenMenuId, setAutoOpenMenuId] = useState(null);
    const autoOpenProcessedRef = useRef(false);
    const navigate = useNavigate();

    const treatAsMobile = isMobile || isZenMode;

    useEffect(() => {
        if (shouldAutoOpenSearch && !autoOpenProcessedRef.current) {
            autoOpenProcessedRef.current = true;
            clearAutoOpen();
            setIsHovered(true);
            setTimeout(() => {
                setAutoOpenMenuId('search');
            }, 300);
        }
    }, [shouldAutoOpenSearch, clearAutoOpen, setIsHovered]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                if (!treatAsMobile) {
                    handleToggleLock();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [treatAsMobile, handleToggleLock]);

    const { handleMouseEnter, handleMouseLeave } = useSiderHover({
        setIsHovered,
        hasOpenMenus: openMenusCount > 0,
        hasVisibleTools: areMeasurementToolsVisible,
        lockMode
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
    const isExpanded = treatAsMobile
        ? isOpen
        : (lockMode === 'expanded' ? true : (lockMode === 'collapsed' ? false : isHovered));

    const handleToggleTools = useCallback(() => {
        toggleMeasurementTools();
        if (lockMode === 'auto') {
            setIsHovered(false);
        }
    }, [toggleMeasurementTools, lockMode, setIsHovered]);

    const menuItems = useMemo(() =>
        createMenuItems({ isHovered: isExpanded, activeLayerIds: contextActiveLayerIds, onToggleLayer, toggleMeasurementTools: handleToggleTools, toolsButtonRef, areMeasurementToolsVisible }),
    [isExpanded, contextActiveLayerIds, onToggleLayer, handleToggleTools, toolsButtonRef, areMeasurementToolsVisible]);

    const clearAutoOpenMenu = useCallback(() => {
        setAutoOpenMenuId(null);
    }, []);

    const handleLogoClick = () => {
        if (treatAsMobile) {
            toggleSider();
        } else {
            navigate('/');
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
            <Logo
                name="mapalab"
                size={sizeLogo[isLoading ? 'loading' : isExpanded ? 'expanded' : 'collapsed']}
                expanded={isExpanded}
                isLoading={isLoading}
                onClick={handleLogoClick}
                tooltip={!treatAsMobile ? 'Ir al inicio' : ''}
                className="shrink-0 p-3 flex justify-center"
            />
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
                                <MenuItem
                                    item={item}
                                    isMobileView={treatAsMobile}
                                    autoOpenMenuId={autoOpenMenuId}
                                    clearAutoOpenMenu={clearAutoOpenMenu}
                                />
                            </div>
                        ))}
                    </div>
                    {menuItems.slice(3).map((item, index) => (
                        <div
                            key={item.id || index}
                            className={`transition-opacity duration-500 w-full shrink-0 overflow-x-hidden`}
                            title={item.tooltip}
                        >
                            <MenuItem
                                item={item}
                                isMobileView={treatAsMobile}
                                autoOpenMenuId={autoOpenMenuId}
                                clearAutoOpenMenu={clearAutoOpenMenu}
                            />
                        </div>
                    ))}
                </div>
            )}

            <Logo
                name="iieg"
                size={isExpanded ? 'w-41 h-13' : 'w-12 h-13'}
                expanded={isExpanded}
                tooltip={!treatAsMobile && 'Fijar menú: Lila = Expandido, Naranja = Colapsado, Negro = Automático. Interaccion con click o (Alt + B)'}
                tooltipPlacement="right"
                colorFilter={lockMode === 'expanded' ? '#CBC5F1' : lockMode === 'collapsed' ? '#FFB98E' : null}
                onClick={!treatAsMobile && handleToggleLock}
                visible={!treatAsMobile || isOpen}
                className="shrink-0 p-3 my-2"
            />
        </aside>
    );
};

export default MapSider;
