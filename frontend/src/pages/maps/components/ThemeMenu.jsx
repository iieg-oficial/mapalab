import { useState } from 'react';
import LayerItem from '@mapsComponents/LayerItem';
import Icon from '@components/Icon';

const LabelItem = ({ layer, activeLayerIds, onToggleLayer }) => {
    return (
        <div className="w-full">
            <div className="p-2">
                <span className="font-garet font-bold text-[12px] text-[#5C2472] tracking-normal">
                    {layer.label}
                </span>
            </div>
            {layer.children && layer.children.length > 0 && (
                <div className="pl-2">
                    {layer.children.map(childLayer => (
                        <LayerItem
                            key={childLayer.id}
                            layer={childLayer}
                            onToggle={onToggleLayer}
                            activeLayerIds={activeLayerIds}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const CategoryItem = ({ layer, activeLayerIds, onToggleLayer }) => {
    const [isManuallyExpanded, setIsManuallyExpanded] = useState(layer.isCategory);

    const renderChild = (childLayer) => {
        if (childLayer.isLabel) {
            return (
                <LabelItem
                    key={childLayer.id}
                    layer={childLayer}
                    activeLayerIds={activeLayerIds}
                    onToggleLayer={onToggleLayer}
                />
            );
        }
        return (
            <LayerItem
                key={childLayer.id}
                layer={childLayer}
                onToggle={onToggleLayer}
                activeLayerIds={activeLayerIds}
            />
        );
    };

    return (
        <div className="w-full">
            <button
                onClick={() => setIsManuallyExpanded(!isManuallyExpanded)}
                className="w-full flex items-center justify-between px-4 group transition-colors cursor-pointer"
            >
                <span className="font-garet font-bold text-[#465055] text-[14px] mt-2 text-left tracking-normal">
                    {layer.label}
                </span>
                <Icon
                    name="downArrow"
                    className={`w-4 h-4 transition-transform duration-200 ${isManuallyExpanded ? 'rotate-180' : ''}`}
                />
            </button>
            <div
                className={`
                    pl-2 grid transition-all duration-300 ease-in-out
                    ${isManuallyExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
                `}
            >
                <div className="overflow-hidden">
                    {layer.children && layer.children.map(childLayer => (
                        <div key={childLayer.id}>{renderChild(childLayer)}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ThemeMenu = ({ theme, activeLayerIds, onToggleLayer, closeButton }) => {
    return (
        <div className="w-full">
            <div className="px-4 pt-3 flex items-center justify-between">
                <h3 className="text-[#5C2472] font-garet font-bold text-[18px]/[47px]">
                    {theme.label}
                </h3>
                {closeButton}
            </div>
            <div className="ml-4 bg-white rounded-[7px] py-2">
                {theme.children && theme.children
                    .filter(layer => !layer.hiddenInMenu)
                    .map(layer => {
                        if (layer.isLabel) {
                            return <LabelItem key={layer.id} layer={layer} activeLayerIds={activeLayerIds} onToggleLayer={onToggleLayer} />;
                        }
                        if (layer.isCategory) {
                            return (
                                <CategoryItem
                                    key={layer.id}
                                    layer={layer}
                                    onToggleLayer={onToggleLayer}
                                    activeLayerIds={activeLayerIds}
                                />
                            );
                        }
                        return (
                            <LayerItem
                                key={layer.id}
                                layer={layer}
                                onToggle={onToggleLayer}
                                activeLayerIds={activeLayerIds}
                            />
                        );
                    })}
            </div>
        </div>
    );
};

export default ThemeMenu;
