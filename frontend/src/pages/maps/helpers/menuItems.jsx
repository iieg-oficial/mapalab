import { useState } from 'react';
import Icon from '@components/Icon';
import BaseMapList from '@mapsComponents/BaseMapList';
import SearchMenu from '@mapsComponents/SearchMenu';
import ThemeMenu from '@mapsComponents/ThemeMenu';
import { layers } from '@pages/maps/helpers/layers/index';
import { SIDER_TRANSITION_TIMING } from '@constants/sider';

const MenuButton = ({ icon, label, isHovered, hasActiveLayers = false, isMenuOpen = false, categoryId = null }) => {
    const [isHovering, setIsHovering] = useState(false);

    const iconName = categoryId || icon;
    const iconState = (hasActiveLayers || isHovering || isMenuOpen) ? 'hover' : 'normal';

    return (
        <button
            className={`
                flex items-center gap-3 py-2 px-2 w-full hover:bg-black/5 transition-all duration-500 rounded-[6px]
                ${isMenuOpen ? 'bg-[#703088]/10' : ''}
            `}
            style={{ transitionTimingFunction: SIDER_TRANSITION_TIMING }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div
                className={`
                    shrink-0 w-[6px] h-8 rounded-[5px] transition-all duration-500
                    ${isMenuOpen ? 'bg-[#FF8300] opacity-100' : 'opacity-0'}
                `}
            />
            <Icon
                name={iconName}
                state={iconState}
                size="size-8"
                className={`transition-all duration-500 ${isMenuOpen ? '' : '-ml-3'}`}
            />
            <span
                className={`
                    transition-all duration-500 truncate whitespace-nowrap font-garet ml-5
                    ${!isHovered ? 'opacity-0 w-0' : 'opacity-100 w-auto'}
                    ${(hasActiveLayers || isHovering || isMenuOpen) ? 'font-bold text-[#5C2472]' : 'font-medium ml-8'}
                `}
            >
                {label}
            </span>
        </button>
    );
};

export const createBaseItems = ({ isHovered, activeLayerIds, onToggleLayer, toggleMeasurementTools, toolsButtonRef, areMeasurementToolsVisible }) => [
    {
        id: 'search',
        hasMenu: true,
        tooltip: 'Buscador por capas',
        menuContent: ({ close }) => <SearchMenu close={close} activeLayerIds={activeLayerIds} onToggleLayer={onToggleLayer} />,
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
        hasMenu: false,
        tooltip: 'Herramientas',
        onClick: toggleMeasurementTools,
        ref: toolsButtonRef,
        component: <MenuButton
            icon="tools"
            label="Herramientas"
            isHovered={isHovered}
            hasActiveLayers={areMeasurementToolsVisible}
        />
    }, {
        id: 'basemaps',
        hasMenu: true,
        tooltip: 'Mapas Base',
        menuContent: () => <BaseMapList />,
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

export const createCategoryItems = ({ isHovered, activeLayerIds, onToggleLayer }) =>
    layers.map(category => {
        const hasActiveLayers = hasActiveChildLayers(category, activeLayerIds);

        return {
            id: category.id,
            hasMenu: true,
            icon: 'layers',
            tooltip: category.label,
            menuContent: () => (
                <ThemeMenu
                    theme={category}
                    activeLayerIds={activeLayerIds}
                    onToggleLayer={onToggleLayer}
                />
            ),
            renderComponent: ({ isMenuOpen }) => (
                <MenuButton
                    icon="layers"
                    categoryId={category.id}
                    label={category.label}
                    isHovered={isHovered}
                    hasActiveLayers={hasActiveLayers}
                    isMenuOpen={isMenuOpen}
                />
            )
        };
    });

export const createMenuItems = (props) => {
    return [
        ...createBaseItems(props),
        ...createCategoryItems(props)
    ];
};