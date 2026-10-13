import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useMapsContext } from '@hooks/useMaps';
import { useLayerLoading } from '@hooks/useLayerLoading';
import { useSider, useSiderHover } from '@contexts/SiderContext';
import { useSearch } from '@contexts/SearchContext';
import { useOutsideClick } from '@hooks/useOutsideClick';
import { useScrollEdges } from 'scroll-edges/react';
import Logo from '@components/Logo';
import { createMenuItems, BASE_ITEMS_COUNT } from '@pages/maps/helpers/menuItems';
import { SIDER_TRANSITION_TIMING, SIDER_LOCK_LABELS } from '@constants/sider';
import { HIDDEN_SCROLLBAR } from '@constants/global';
import { useEventoContext } from '@hooks/useEvento';
import { useAutoOpenEventoFromUrl } from '@pages/maps/hooks/useAutoOpenEventoFromUrl';
import { aggregateFactsFromEventos } from '@pages/maps/helpers/funFactPicker';
import { esEventoLite } from '@pages/maps/helpers/eventoDiversion';
import ExternalEventoWidget from '@mapsComponents/ExternalEventoWidget';

import { trackSiderLock, trackLogoClick, trackMeasurementPanelOpen } from '@services/analyticsService';
import { useMarcaIieg } from '@pages/maps/hooks/useMarcaIieg';
import { useBadgeSeen, isBadgeSeen } from '@pages/maps/helpers/badgeSeenStore';
import { useZenMode } from './ZenMode';
import MenuItem from './MenuItem';
import SiderEdgeButtons from './SiderEdgeButtons';
import EnvBadge from './EnvBadge';
import LogoIieg from './DiaDeMuertos/LogoIieg';

const SIDER_EVENTS_ENABLED = false;
const EMPTY_EVENTOS = Object.freeze([]);

const MenuGroup = ({ items, isMobileView, autoOpenMenuId, clearAutoOpenMenu }) => items.map((item, index) => (
    <div key={item.id || index} className="transition-opacity duration-500 w-full shrink-0 overflow-x-hidden" title={item.tooltip}>
        <MenuItem item={item} isMobileView={isMobileView} autoOpenMenuId={autoOpenMenuId} clearAutoOpenMenu={clearAutoOpenMenu} />
    </div>
));

const MapSider = ({ className = '' }) => {
    const {
        activeLayerIds: contextActiveLayerIds,
        onToggleLayer,
        toggleMeasurementTools,
        areMeasurementToolsVisible,
        toggleAnnotationTools,
        areAnnotationToolsVisible,
        isDrawing,
        measurements,
        isLocating,
        dateLoops,
        showMarker,
        allLayers,
        compareMode
    } = useMapsContext();

    const toolsPanelVisible = areMeasurementToolsVisible || areAnnotationToolsVisible || isDrawing || measurements.length > 0;
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
        toggleLock,
        setLock,
        hoverLocked
    } = useSider();
    const handleToggleLock = useCallback(() => {
        const nextByMode = { auto: 'expanded', expanded: 'collapsed', collapsed: 'mobile', mobile: 'auto' };
        trackSiderLock(SIDER_LOCK_LABELS[nextByMode[lockMode]] || 'automatico');
        toggleLock();
    }, [lockMode, toggleLock]);

    const handleSelectLock = useCallback((mode) => {
        trackSiderLock(SIDER_LOCK_LABELS[mode] || mode);
        setLock(mode);
    }, [setLock]);

    const { shouldAutoOpenSearch, clearAutoOpen } = useSearch();
    const { isZenMode } = useZenMode();
    const { getContainerProps } = useScrollEdges({ mask: true });
    const [autoOpenMenuId, setAutoOpenMenuId] = useState(null);
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

    useAutoOpenEventoFromUrl({ setAutoOpenMenuId, setIsHovered });

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
        hoverLocked,
        lockMode
    });

    useOutsideClick([siderRef], () => {
        if (treatAsMobile && isOpen && openMenusCount === 0) closeSider();
    });

    const width = treatAsMobile ? (isOpen ? expandedWidth : mobileWidth) : (isHovered ? expandedWidth : collapsedWidth);
    const isExpanded = treatAsMobile
        ? isOpen
        : (lockMode === 'expanded' ? true : (lockMode === 'collapsed' ? false : isHovered));

    const handleToggleTools = useCallback(() => {
        if (!areMeasurementToolsVisible) trackMeasurementPanelOpen();
        toggleMeasurementTools();
        if (treatAsMobile && !areMeasurementToolsVisible) {
            closeSider();
            if (lockMode?.release) lockMode.release();
        }
        setIsHovered(false);
    }, [areMeasurementToolsVisible, toggleMeasurementTools, treatAsMobile, closeSider, lockMode, setIsHovered]);

    const handleToggleAnnotations = useCallback(() => {
        if (!areAnnotationToolsVisible) trackMeasurementPanelOpen();
        toggleAnnotationTools?.();
        if (treatAsMobile && !areAnnotationToolsVisible) {
            closeSider();
            if (lockMode?.release) lockMode.release();
        }
        setIsHovered(false);
    }, [areAnnotationToolsVisible, toggleAnnotationTools, treatAsMobile, closeSider, lockMode, setIsHovered]);

    const { eventos, activeEvento } = useEventoContext();
    const eventosForSider = SIDER_EVENTS_ENABLED ? eventos : EMPTY_EVENTOS;

    const globalFactsEvento = useMemo(() => {
        const facts = aggregateFactsFromEventos(eventos);
        const lider = (eventos || []).find((e) => Array.isArray(e?.facts) && e.facts.length > 0);
        return {
            id: 'sider-global-facts',
            slug: lider?.slug || null,
            facts,
            funIcon: lider?.funIcon || null,
            animacion: lider?.animacion || null,
            botonEstilo: lider?.botonEstilo || null,
            avisoInicial: lider?.avisoInicial || null,
        };
    }, [eventos]);
    const eventosCompletos = useMemo(() => (eventos || []).filter((e) => !esEventoLite(e)), [eventos]);
    const showGlobalFunButton = !activeEvento && globalFactsEvento.facts.length > 0;

    const badgeSeenVersion = useBadgeSeen();

    const menuItems = useMemo(() =>
        createMenuItems({ isHovered: isExpanded, activeLayerIds: contextActiveLayerIds, onToggleLayer, toggleMeasurementTools: handleToggleTools, toggleAnnotationTools: handleToggleAnnotations, toolsButtonRef, areMeasurementToolsVisible, areAnnotationToolsVisible, layers: allLayers, eventos: eventosForSider, isBadgeSeen }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isExpanded, contextActiveLayerIds, onToggleLayer, handleToggleTools, handleToggleAnnotations, toolsButtonRef, areMeasurementToolsVisible, areAnnotationToolsVisible, allLayers, eventosForSider, badgeSeenVersion]);

    const eventCount = eventosForSider.length;
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

    const abrirMarcaIieg = useMarcaIieg({ showMarker, allLayers });
    const handleIiegLogoClick = useCallback(() => {
        trackLogoClick('iieg');
        if (treatAsMobile) closeSider();
        abrirMarcaIieg();
    }, [abrirMarcaIieg, treatAsMobile, closeSider]);

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
                onMouseEnter={!treatAsMobile ? (e) => { if (!e.target?.closest?.('[data-sider-nohover]')) handleMouseEnter(); } : undefined}
                onMouseLeave={!treatAsMobile ? handleMouseLeave : undefined}
            >
                <div
                    className="shrink-0 flex justify-center relative"
                    onTouchStart={handleLogoTouchStart}
                    onTouchEnd={handleLogoTouchEnd}
                    onTouchCancel={handleLogoTouchEnd}
                    onContextMenu={(e) => treatAsMobile && e.preventDefault()}
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
                    <SiderEdgeButtons
                        layout={treatAsMobile && !isOpen ? 'row' : 'column'}
                        isMobile={isMobile}
                        lockMode={lockMode}
                        isExpanded={isExpanded}
                        onToggle={handleToggleLock}
                        onSelect={handleSelectLock}
                        funEvento={showGlobalFunButton ? globalFactsEvento : null}
                    />
                </div>
                {(!treatAsMobile || isOpen) && (
                    <div {...getContainerProps({ className: `flex-1 flex flex-col gap-3 px-3 ${HIDDEN_SCROLLBAR}` })}>
                        <div className="bg-[#F9FBFF] rounded-[8px] py-2 flex flex-col gap-3">
                            <MenuGroup items={menuItems.slice(0, baseItemsEnd)} isMobileView={treatAsMobile} autoOpenMenuId={autoOpenMenuId} clearAutoOpenMenu={clearAutoOpenMenu} />
                        </div>
                        {!treatAsMobile && eventCount > 0 && (
                            <div className="flex flex-col gap-2">
                                <MenuGroup items={menuItems.slice(baseItemsEnd, eventItemsEnd)} isMobileView={treatAsMobile} autoOpenMenuId={autoOpenMenuId} clearAutoOpenMenu={clearAutoOpenMenu} />
                            </div>
                        )}
                        <MenuGroup items={menuItems.slice(eventItemsEnd)} isMobileView={treatAsMobile} autoOpenMenuId={autoOpenMenuId} clearAutoOpenMenu={clearAutoOpenMenu} />
                    </div>
                )}

                <LogoIieg isExpanded={isExpanded} visible={!treatAsMobile || isOpen} onClick={handleIiegLogoClick} />
            </aside>
            {!isSwipe && (
                <ExternalEventoWidget eventos={eventosCompletos} activeLayerIds={contextActiveLayerIds} onToggleLayer={onToggleLayer} treatAsMobile={treatAsMobile} isOpen={isOpen} toolsPanelVisible={toolsPanelVisible} siderWidth={width} autoOpenMenuId={autoOpenMenuId} clearAutoOpenMenu={clearAutoOpenMenu} />
            )}
        </>
    );
};

export default MapSider;
