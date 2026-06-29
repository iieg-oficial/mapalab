/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import Icon from '@components/Icon';
import BaseMapList from '@mapsComponents/BaseMapList';
import SearchMenu from '@mapsComponents/SearchMenu';
import ThemeMenu from '@mapsComponents/ThemeMenu';
import EventoMenu from '@mapsComponents/EventoMenu';
import EventoIconButton from '@mapsComponents/EventoIconButton';
import ToolsMenu from '@mapsComponents/ToolsMenu';
import { SIDER_TRANSITION_TIMING } from '@constants/sider';
import { themeHasUnseenBadge } from '@pages/maps/helpers/badgeHelpers';

const MenuButton = ({ icon, imageUrl, label, isHovered, hasActiveLayers = false, isMenuOpen = false, categoryId = null, iconOverrides = null, hasUnseenBadge = false }) => {
    const [isHovering, setIsHovering] = useState(false);

    const iconName = categoryId || icon;
    const iconState = (hasActiveLayers || isHovering || isMenuOpen) ? 'hover' : 'normal';
    const stateImageUrl = iconOverrides?.[iconState] || imageUrl;

    return (
        <div
            className={`
                flex items-center gap-3 py-2 px-2 w-full hover:bg-black/5 transition-all duration-500 rounded-md
                ${isMenuOpen ? 'bg-purple-deep/10' : ''}
            `}
            style={{ transitionTimingFunction: SIDER_TRANSITION_TIMING }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div
                className={`
                    shrink-0 w-1.5 h-8 rounded-[5px] transition-all duration-500
                    ${isMenuOpen ? 'bg-orange opacity-100' : 'opacity-0'}
                `}
            />
            <span className={`relative inline-flex shrink-0 transition-all duration-500 ${isMenuOpen ? '' : '-ml-3'}`}>
                {stateImageUrl ? (
                    <img
                        src={stateImageUrl}
                        alt={label || ''}
                        className="size-8 shrink-0 object-contain"
                    />
                ) : (
                    <Icon
                        name={iconName}
                        state={iconState}
                        size="size-8"
                        className="shrink-0"
                    />
                )}
                {hasUnseenBadge && (
                    <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-orange ring-2 ring-white" />
                )}
            </span>
            <span
                className={`
                    transition-all duration-500 truncate whitespace-nowrap font-garet ml-5
                    ${!isHovered ? 'opacity-0 w-0' : 'opacity-100 w-auto'}
                    ${(hasActiveLayers || isHovering || isMenuOpen) ? 'font-bold text-purple' : 'font-medium ml-8'}
                `}
            >
                {label}
            </span>
        </div>
    );
};

const createBaseItems = ({ isHovered, activeLayerIds, onToggleLayer, toggleMeasurementTools, toggleAnnotationTools, toolsButtonRef, areMeasurementToolsVisible, areAnnotationToolsVisible }) => [
    {
        id: 'search',
        hasMenu: true,
        tooltip: 'Buscador por capas',
        menuContent: ({ closeButton } = {}) => <SearchMenu onToggleLayer={onToggleLayer} activeLayerIds={activeLayerIds} closeButton={closeButton} />,
        renderComponent: ({ isMenuOpen }) => (
            <MenuButton
                icon="search"
                label="Buscador"
                isHovered={isHovered}
                isMenuOpen={isMenuOpen}
            />
        )
    }, {
        id: 'tools',
        hasMenu: true,
        tooltip: 'Herramientas',
        ref: toolsButtonRef,
        menuContent: ({ close, closeButton } = {}) => (
            <ToolsMenu
                close={close}
                closeButton={closeButton}
                toggleMeasurementTools={toggleMeasurementTools}
                toggleAnnotationTools={toggleAnnotationTools}
                areMeasurementToolsVisible={areMeasurementToolsVisible}
                areAnnotationToolsVisible={areAnnotationToolsVisible}
            />
        ),
        renderComponent: ({ isMenuOpen }) => (
            <MenuButton
                icon="tools"
                label="Herramientas"
                isHovered={isHovered}
                hasActiveLayers={areMeasurementToolsVisible}
                isMenuOpen={isMenuOpen}
            />
        )
    }, {
        id: 'basemaps',
        hasMenu: true,
        tooltip: 'Mapas Base',
        menuContent: ({ closeButton } = {}) => <BaseMapList closeButton={closeButton} />,
        renderComponent: ({ isMenuOpen }) => (
            <MenuButton
                icon="basemaps"
                label="Mapas base"
                isHovered={isHovered}
                isMenuOpen={isMenuOpen}
            />
        )
    }
];

const getAllDescendantIds = (layer) => {
    let ids = [];

    if (layer.children && layer.children.length > 0) {
        for (const child of layer.children) {
            ids.push(child.id);
            ids = ids.concat(getAllDescendantIds(child));
        }
    }

    return ids;
};

const hasActiveChildLayers = (category, activeLayerIds) => {
    const descendantIds = getAllDescendantIds(category);
    return descendantIds.some(id => activeLayerIds.includes(id));
};

const createCategoryItems = ({ isHovered, activeLayerIds, onToggleLayer, layers = [], isBadgeSeen }) =>
    layers.filter(category => !category.hiddenInMenu).map(category => {
        const hasActiveLayers = hasActiveChildLayers(category, activeLayerIds);
        const hasUnseenBadge = typeof isBadgeSeen === 'function'
            && themeHasUnseenBadge(category, isBadgeSeen);

        return {
            id: category.id,
            hasMenu: true,
            icon: 'layers',
            tooltip: category.label,
            menuContent: ({ closeButton } = {}) => (
                <ThemeMenu
                    theme={category}
                    activeLayerIds={activeLayerIds}
                    onToggleLayer={onToggleLayer}
                    closeButton={closeButton}
                />
            ),
            renderComponent: ({ isMenuOpen }) => (
                <MenuButton
                    icon="layers"
                    categoryId={category.id}
                    imageUrl={category.iconUrl}
                    iconOverrides={category.iconOverrides || null}
                    label={category.label}
                    isHovered={isHovered}
                    hasActiveLayers={hasActiveLayers}
                    isMenuOpen={isMenuOpen}
                    hasUnseenBadge={hasUnseenBadge}
                />
            )
        };
    });

const createEventoItems = ({ isHovered, activeLayerIds, onToggleLayer, eventos = [] }) =>
    eventos.map((evento) => ({
        id: `evento-${evento.id}`,
        hasMenu: true,
        tooltip: evento.titulo,
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
                isHovered={isHovered}
            />
        ),
    }));

export const createMenuItems = (props) => {
    return [
        ...createBaseItems(props),
        ...createEventoItems(props),
        ...createCategoryItems(props)
    ];
};

export const BASE_ITEMS_COUNT = 3;