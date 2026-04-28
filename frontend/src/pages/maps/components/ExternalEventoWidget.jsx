import { useMemo, useState } from 'react';
import { SIDER_TRANSITION_TIMING } from '@constants/sider';
import EventoIconButton from '@mapsComponents/EventoIconButton';
import EventoMenu from '@mapsComponents/EventoMenu';
import MenuItem from '@mapsComponents/MenuItem';


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

    const items = useMemo(() =>
        (eventos || []).map((evento) => ({
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
                    iconUrl={evento.iconoUrl}
                    imageUrl={evento.imagenUrl}
                    title={evento.titulo}
                    isMenuOpen={isMenuOpen}
                    isHovered={externalHovered}
                    compactClassName="w-14 h-17"
                />
            ),
        })),
    [eventos, activeLayerIds, onToggleLayer, externalHovered]);

    if (items.length === 0) return null;

    if (treatAsMobile) {
        if (isOpen || areMeasurementToolsVisible) return null;
        return (
            <div
                className="absolute z-21 flex flex-col items-center gap-2"
                style={{ top: 120, left: 16 }}
            >
                {items.map((item) => (
                    <div key={item.id} className="w-14 h-17">
                        <MenuItem
                            item={item}
                            isMobileView
                            autoOpenMenuId={null}
                            clearAutoOpenMenu={() => {}}
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
        >
            {items.map((item) => (
                <div
                    key={item.id}
                    className="overflow-hidden rounded-md transition-all duration-500"
                    style={{
                        width: externalHovered ? 280 : 56,
                        height: externalHovered ? 'auto' : 68,
                        transitionTimingFunction: SIDER_TRANSITION_TIMING,
                    }}
                >
                    <MenuItem
                        item={item}
                        isMobileView={false}
                        autoOpenMenuId={null}
                        clearAutoOpenMenu={() => {}}
                    />
                </div>
            ))}
        </div>
    );
};

export default ExternalEventoWidget;
