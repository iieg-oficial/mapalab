import Icon from '@components/Icon';
import BaseMapList from '@mapsComponents/BaseMapList';
import SearchMenu from '@mapsComponents/SearchMenu';
import LayerItem from '@mapsComponents/LayerItem';
import { layers } from '@pages/maps/helpers/layers/index';
import { SIDER_TRANSITION_TIMING } from '@constants/sider';

const MenuButton = ({ icon, label, isHovered, hasActiveLayers = false, isMenuOpen = false }) => {
    return (
        <button className={`
            flex items-center p-[13px] w-full hover:bg-black/5 transition-all duration-500 relative
            ${isHovered ? 'gap-2' : 'gap-0 justify-center'}
            ${isMenuOpen ? 'bg-purple-600/10' : ''}
        `}>
            {hasActiveLayers && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 rounded-l-md" />
            )}
            <Icon name={icon} className="shrink-0 w-[29px] h-[29px]" />
            <span
                className={`
                    transition-all duration-500
                    truncate whitespace-nowrap
                    ${!isHovered ? 'opacity-0 w-0' : 'opacity-100 w-auto'}
                `}
                style={{ transitionTimingFunction: SIDER_TRANSITION_TIMING }}
            >
                {label}
            </span>
        </button>
    );
};

export const createBaseItems = ({ isHovered, activeLayerIds, onToggleLayer, toggleMeasurementTools, toolsButtonRef }) => [
    {
        id: 'search',
        hasMenu: true,
        tooltip: 'Buscar',
        menuContent: ({ close }) => <SearchMenu close={close} activeLayerIds={activeLayerIds} onToggleLayer={onToggleLayer} />,
        component: <MenuButton icon="search" label="Buscar" isHovered={isHovered} />
    }, {
        id: 'tools',
        hasMenu: false,
        tooltip: 'Herramientas',
        onClick: toggleMeasurementTools,
        ref: toolsButtonRef,
        component: <MenuButton icon="tools" label="Herramientas" isHovered={isHovered} />
    }, {
        id: 'basemaps',
        hasMenu: true,
        tooltip: 'Mapas Base',
        menuContent: () => <BaseMapList />,
        component: <MenuButton icon="layers" label="Mapas base" isHovered={isHovered} />
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
                <div className="min-w-[250px] max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    {category.children && category.children.map(layer => (
                        <LayerItem
                            key={layer.id}
                            layer={layer}
                            onToggle={onToggleLayer}
                            activeLayerIds={activeLayerIds}
                        />
                    ))}
                </div>
            ),
            renderComponent: ({ isMenuOpen }) => (
                <MenuButton
                    icon="layers"
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