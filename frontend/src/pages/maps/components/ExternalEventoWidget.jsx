import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SIDER_TRANSITION_TIMING, SIDER_HOVER_DELAY_LEAVE_DEFAULT } from '@constants/sider';
import Tooltip from '@components/Tooltip';
import EventoIconButton from '@mapsComponents/EventoIconButton';
import EventoMenu from '@mapsComponents/EventoMenu';
import MenuItem from '@mapsComponents/MenuItem';


const buildHoverHint = (titulo) =>
    `Da clic para descubrir todas las capas y detalles de "${titulo}".`;

const ExternalEventoItem = ({ evento, activeLayerIds, onToggleLayer, externalHovered, isMobileView }) => {
    const item = useMemo(() => ({
        id: `ext-evento-${evento.id}`,
        hasMenu: true,
        tooltip: evento.titulo,
        panelPlacement: 'bottom-start',
        panelRounded: 'rounded-2xl',
        menuContent: ({ closeButton } = {}) => (
            <EventoMenu
                evento={evento}
                activeLayerIds={activeLayerIds}
                onToggleLayer={onToggleLayer}
                closeButton={closeButton}
            />
        ),
        renderComponent: ({ isMenuOpen }) => (
            <Tooltip
                content={buildHoverHint(evento.titulo)}
                variant="warning"
                placement={isMobileView ? 'right' : 'bottom'}
                delay={600}
                disabled={isMenuOpen || !externalHovered}
                triggerBlock
                triggerClassName="w-full"
            >
                <EventoIconButton
                    iconoUrl={evento.iconoUrl}
                    imagenUrl={evento.imagenUrl}
                    titulo={evento.titulo}
                    isMenuOpen={isMenuOpen}
                    isHovered={externalHovered}
                    compactClassName="w-14 h-17"
                />
            </Tooltip>
        ),
    }), [evento, activeLayerIds, onToggleLayer, externalHovered, isMobileView]);

    return (
        <MenuItem
            item={item}
            isMobileView={isMobileView}
            autoOpenMenuId={null}
            clearAutoOpenMenu={() => {}}
        />
    );
};


const ExternalEventoWidget = ({
    eventos,
    activeLayerIds,
    onToggleLayer,
    treatAsMobile,
    isOpen,
    areMeasurementToolsVisible,
    siderWidth,
}) => {
    const [externalHovered, setExternalHovered] = useState(false);
    const leaveTimerRef = useRef(null);

    const clearLeaveTimer = () => {
        if (leaveTimerRef.current) {
            clearTimeout(leaveTimerRef.current);
            leaveTimerRef.current = null;
        }
    };

    const handleEnter = useCallback(() => {
        clearLeaveTimer();
        setExternalHovered(true);
    }, []);

    const handleLeave = useCallback(() => {
        clearLeaveTimer();
        leaveTimerRef.current = setTimeout(() => {
            setExternalHovered(false);
        }, SIDER_HOVER_DELAY_LEAVE_DEFAULT);
    }, []);

    useEffect(() => () => clearLeaveTimer(), []);

    if (!eventos?.length) return null;

    if (treatAsMobile) {
        if (isOpen || areMeasurementToolsVisible) return null;
        return (
            <div
                className="absolute z-21 flex flex-col items-center gap-2"
                style={{ top: 120, left: 16 }}
            >
                {eventos.map((evento) => (
                    <div key={`ext-evento-${evento.id}`} className="w-14 h-17">
                        <ExternalEventoItem
                            evento={evento}
                            activeLayerIds={activeLayerIds}
                            onToggleLayer={onToggleLayer}
                            externalHovered={externalHovered}
                            isMobileView
                        />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div
            className="absolute top-7 z-21 flex flex-col items-center gap-2 transition-all duration-500"
            style={{
                left: 16 + siderWidth + 28,
                transitionTimingFunction: SIDER_TRANSITION_TIMING,
            }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            onFocus={handleEnter}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) handleLeave();
            }}
            role="region"
            aria-label="Eventos especiales"
        >
            {eventos.map((evento) => (
                <div
                    key={`ext-evento-${evento.id}`}
                    className="overflow-hidden rounded-md transition-all duration-500"
                    style={{
                        width: externalHovered ? 280 : 56,
                        height: externalHovered ? 'auto' : 68,
                        transitionTimingFunction: SIDER_TRANSITION_TIMING,
                    }}
                >
                    <ExternalEventoItem
                        evento={evento}
                        activeLayerIds={activeLayerIds}
                        onToggleLayer={onToggleLayer}
                        externalHovered={externalHovered}
                        isMobileView={false}
                    />
                </div>
            ))}
        </div>
    );
};

export default ExternalEventoWidget;
