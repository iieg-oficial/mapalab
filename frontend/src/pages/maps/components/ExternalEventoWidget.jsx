import { useMemo, useState } from 'react';
import { SIDER_TRANSITION_TIMING } from '@constants/sider';
import EventoIconButton from '@mapsComponents/EventoIconButton';
import EventoMenu from '@mapsComponents/EventoMenu';
import MenuItem from '@mapsComponents/MenuItem';


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
            <EventoIconButton
                iconoUrl={evento.iconoUrl}
                imagenUrl={evento.imagenUrl}
                titulo={evento.titulo}
                isMenuOpen={isMenuOpen}
                isHovered={externalHovered}
                compactClassName="w-14 h-17"
            />
        ),
    }), [evento, activeLayerIds, onToggleLayer, externalHovered]);

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
            onMouseEnter={() => setExternalHovered(true)}
            onMouseLeave={() => setExternalHovered(false)}
            onFocus={() => setExternalHovered(true)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setExternalHovered(false);
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
