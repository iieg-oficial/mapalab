import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useMapsContext } from '@hooks/useMaps';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { useSider, useSiderHover } from '@contexts/SiderContext';
import { useSearch } from '@contexts/SearchContext';
import { useOutsideClick } from '@hooks/useOutsideClick';
import { useScrollOverflow } from '@hooks/useScrollOverflow';
import Logo from '@components/Logo';
import { createMenuItems, BASE_ITEMS_COUNT } from '@pages/maps/helpers/menuItems';
import { SIDER_TRANSITION_TIMING } from '@constants/sider';
import { HIDDEN_SCROLLBAR } from '@constants/global';
import { useEventoContext } from '@hooks/useEvento';
import ExternalEventoWidget from '@mapsComponents/ExternalEventoWidget';

import { trackSiderLock } from '@services/analyticsService';
import { buildIiegMarker, computeIiegStats } from '@pages/maps/helpers/markerDefinitions';
import { getDatabaseStats } from '@services/layerMetadataService';
import { useZenMode } from './ZenMode';
import MenuItem from './MenuItem';
import SiderModeButton from './SiderModeButton';
import EnvBadge from './EnvBadge';

const MapSider = ({ className = '' }) => {
    const {
        activeLayerIds: contextActiveLayerIds,
        onToggleLayer,
        toggleMeasurementTools,
        areMeasurementToolsVisible,
        isLocating,
        dateLoops,
        showMarker,
        allLayers,
        compareMode
    } = useMapsContext();
    const isSwipe = !!compareMode?.active;
    const { loadingLayers } = useLayerLoading();
    const hasNonLoopLoading = [...loadingLayers].some(id => !dateLoops[id] && contextActiveLayerIds.includes(id));
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
        const labels = { auto: 'expandido', expanded: 'colapsado', collapsed: 'mobile', mobile: 'automatico' };
        trackSiderLock(labels[lockMode] || 'automatico');
        toggleLock();
    }, [lockMode, toggleLock]);

    const { shouldAutoOpenSearch, clearAutoOpen } = useSearch();
    const { isZenMode } = useZenMode();
    const contentRef = useRef(null);
    const { canScrollUp, canScrollDown } = useScrollOverflow(contentRef);
    const [autoOpenMenuId, setAutoOpenMenuId] = useState(null);
    const [showModeBtn, setShowModeBtn] = useState(false);
    const autoOpenProcessedRef = useRef(false);
    const navigate = useNavigate();

    const treatAsMobile = isMobile || isZenMode || lockMode === 'mobile';

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
                if (!isMobile) {
                    handleToggleLock();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobile, handleToggleLock]);

    const { handleMouseEnter, handleMouseLeave } = useSiderHover({
        setIsHovered,
        hasOpenMenus: openMenusCount > 0,
        hasVisibleTools: areMeasurementToolsVisible,
        lockMode
    });

    useOutsideClick([siderRef], () => {
        if (treatAsMobile && isOpen && openMenusCount === 0) closeSider();
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
        if (treatAsMobile) {
            closeSider();
        } else if (lockMode === 'auto') {
            setIsHovered(false);
        }
    }, [toggleMeasurementTools, treatAsMobile, closeSider, lockMode, setIsHovered]);

    const { eventos } = useEventoContext();

    const menuItems = useMemo(() =>
        createMenuItems({ isHovered: isExpanded, activeLayerIds: contextActiveLayerIds, onToggleLayer, toggleMeasurementTools: handleToggleTools, toolsButtonRef, areMeasurementToolsVisible, layers: allLayers, eventos }),
    [isExpanded, contextActiveLayerIds, onToggleLayer, handleToggleTools, toolsButtonRef, areMeasurementToolsVisible, allLayers, eventos]);

    const eventCount = eventos?.length || 0;
    const baseItemsEnd = BASE_ITEMS_COUNT;
    const eventItemsEnd = baseItemsEnd + eventCount;

    const clearAutoOpenMenu = useCallback(() => {
        setAutoOpenMenuId(null);
    }, []);

    const longPressRef = useRef(null);

    const handleLogoClick = () => {
        if (treatAsMobile) {
            if (longPressRef.current === 'fired') {
                longPressRef.current = null;
                return;
            }
            toggleSider();
        } else {
            navigate('/');
        }
    };

    const handleLogoTouchStart = useCallback(() => {
        if (!treatAsMobile) return;
        longPressRef.current = setTimeout(() => {
            longPressRef.current = 'fired';
            navigate('/');
        }, 1000);
    }, [treatAsMobile, navigate]);

    const handleLogoTouchEnd = useCallback(() => {
        if (longPressRef.current && longPressRef.current !== 'fired') {
            clearTimeout(longPressRef.current);
        }
    }, []);

    const handleIiegLogoClick = useCallback(async () => {
        if (treatAsMobile) closeSider();
        const stats = computeIiegStats({ allLayers });
        const dbStats = await getDatabaseStats();
        showMarker?.(buildIiegMarker({ ...stats, totalRecords: dbStats?.total_records ?? null }));
    }, [showMarker, treatAsMobile, closeSider, allLayers]);

    const sizeLogo = {
        expanded: 'w-57 h-17',
        collapsed: 'w-14 h-17',
        loading: 'w-14 h-17'
    }

    return (
        <>
            <aside
                ref={siderRef}
                className={[
                    'absolute top-4 left-4 z-20 max-md:z-22 flex flex-col',
                    'max-h-[calc(100dvh-2rem)] bg-white shadow-[0_5px_20px_#1A26641A] rounded-[10px] overflow-visible',
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
                    className="shrink-0 flex justify-center relative"
                    onTouchStart={handleLogoTouchStart}
                    onTouchEnd={handleLogoTouchEnd}
                    onTouchCancel={handleLogoTouchEnd}
                    onContextMenu={(e) => treatAsMobile && e.preventDefault()}
                    onMouseEnter={() => setShowModeBtn(true)}
                    onMouseLeave={() => setShowModeBtn(false)}
                >
                    <Logo
                        name="mapalab"
                        size={sizeLogo[isLoading ? 'loading' : isExpanded ? 'expanded' : 'collapsed']}
                        expanded={isExpanded}
                        isLoading={isLoading}
                        onClick={handleLogoClick}
                        tooltip={!treatAsMobile ? 'Ir al inicio' : ''}
                        tooltipPlacement='bottom'
                        className="shrink-0 p-3 flex justify-center"
                    />
                    <EnvBadge />
                    {!isMobile && (
                        <div className={[
                            'absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 z-10 transition-opacity duration-200',
                            lockMode !== 'auto' || showModeBtn ? 'opacity-100' : 'opacity-0',
                        ].join(' ')}>
                            <SiderModeButton lockMode={lockMode} onToggle={handleToggleLock} />
                        </div>
                    )}
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
                        <div
                            className="bg-[#F9FBFF] rounded-[8px] py-2 flex flex-col gap-3"
                            onMouseEnter={() => setShowModeBtn(true)}
                            onMouseLeave={() => setShowModeBtn(false)}
                        >
                            {menuItems.slice(0, baseItemsEnd).map((item, index) => (
                                <div
                                    key={item.id || index}
                                    className="transition-opacity duration-500 w-full shrink-0 overflow-x-hidden"
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
                        {!treatAsMobile && eventCount > 0 && (
                            <div
                                className="flex flex-col gap-2"
                                onMouseEnter={() => setShowModeBtn(true)}
                                onMouseLeave={() => setShowModeBtn(false)}
                            >
                                {menuItems.slice(baseItemsEnd, eventItemsEnd).map((item, index) => (
                                    <div
                                        key={item.id || index}
                                        className="transition-opacity duration-500 w-full shrink-0 overflow-x-hidden"
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
                        {menuItems.slice(eventItemsEnd).map((item, index) => (
                            <div
                                key={item.id || index}
                                className="transition-opacity duration-500 w-full shrink-0 overflow-x-hidden"
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
                    visible={!treatAsMobile || isOpen}
                    onClick={handleIiegLogoClick}
                    tooltip="Acerca de Mapa Lab"
                    tooltipPlacement="top"
                    className="shrink-0 p-3 my-2 w-full"
                />
            </aside>
            {!isSwipe && (
                <ExternalEventoWidget eventos={eventos} activeLayerIds={contextActiveLayerIds} onToggleLayer={onToggleLayer} treatAsMobile={treatAsMobile} isOpen={isOpen} areMeasurementToolsVisible={areMeasurementToolsVisible} siderWidth={width} />
            )}
        </>
    );
};

export default MapSider;
