import { useMemo, useCallback, useState } from 'react';
import Switch from '@components/Switch';

const LayerItem = ({ layer, onToggle, activeLayerIds, depth = 0 }) => {
    const isActive = activeLayerIds.includes(layer.id);
    const hasChildren = layer.children && layer.children.length > 0;
    const isTopLevel = depth === 0;
    const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);

    const getAllDescendantIds = useCallback((layer) => {
        const ids = [];
        if (layer.children) {
            layer.children.forEach(child => {
                if (!child.isCategory) {
                    ids.push(child.id);
                }
                if (child.children) {
                    ids.push(...getAllDescendantIds(child));
                }
            });
        }
        return ids;
    }, []);

    const { allChildrenActive, hasPartialSelection, hasAnyChildActive } = useMemo(() => {
        if (!hasChildren) return { allChildrenActive: false, hasPartialSelection: false, hasAnyChildActive: false };

        const directChildIds = layer.children
            .filter(child => !child.isCategory)
            .map(child => child.id);

        const activeDirectChildren = directChildIds.filter(childId => activeLayerIds.includes(childId));

        const allDescendantIds = getAllDescendantIds(layer);
        const activeDescendants = allDescendantIds.filter(id => activeLayerIds.includes(id));

        const hasAnyDescendantActive = activeDescendants.length > 0;
        const allDescendantsActive = allDescendantIds.length > 0 && activeDescendants.length === allDescendantIds.length;

        return {
            allChildrenActive: directChildIds.length > 0 && activeDirectChildren.length === directChildIds.length,
            isFullyActive: allDescendantsActive,

            hasPartialSelection: hasAnyDescendantActive && !allDescendantsActive,
            hasAnyChildActive: hasAnyDescendantActive
        };
    }, [layer, activeLayerIds, hasChildren, getAllDescendantIds]);

    const isDisabled = layer.label && layer.label.startsWith('*');

    if (layer.isCategory) {
        return (
            <div className={`w-full ${depth > 0 ? 'ml-4' : ''}`}>
                <div className="px-4 py-2 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                    {layer.label}
                </div>
                <div className="pl-2">
                    {layer.children.map(childLayer => (
                        <LayerItem
                            key={childLayer.id}
                            layer={childLayer}
                            onToggle={onToggle}
                            activeLayerIds={activeLayerIds}
                            depth={depth}
                        />
                    ))}
                </div>
            </div>
        );
    }

    const isExpanded = hasChildren && (isManuallyExpanded || allChildrenActive || hasPartialSelection || hasAnyChildActive);

    const handleSwitchChange = useCallback((newValue) => {
        if (isDisabled) return;
        onToggle(layer.id, newValue);
    }, [onToggle, layer.id, isDisabled]);

    const handleCheckboxClick = useCallback((e) => {
        e.stopPropagation();
        if (isDisabled) return;
        onToggle(layer.id, !isActive);
    }, [onToggle, layer.id, isActive, isDisabled]);

    const handleLabelClick = useCallback(() => {
        if (isDisabled) return;
        if (hasChildren) {
            setIsManuallyExpanded(prev => !prev);
        } else {
            onToggle(layer.id, !isActive);
        }
    }, [onToggle, layer.id, isActive, hasChildren, isDisabled]);

    const switchChecked = hasChildren ? (activeLayerIds.includes(layer.id) || allChildrenActive) : isActive;

    const switchIndeterminate = hasChildren ? hasPartialSelection : false;
    const useSwitch = isTopLevel || hasChildren;

    return (
        <div>
            <div className={`flex items-center px-4 py-2 w-full ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/5'}`}>
                {useSwitch ? (
                    <Switch
                        checked={switchChecked}
                        indeterminate={switchIndeterminate}
                        onChange={handleSwitchChange}
                        disabled={isDisabled}
                        className="mr-2"
                    />
                ) : (
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={handleCheckboxClick}
                        disabled={isDisabled}
                        className="mr-2"
                    />
                )}
                <span
                    className={`flex-grow ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={handleLabelClick}
                >
                    {layer.label}
                </span>
            </div>

            {isExpanded && (
                <div className="pl-6">
                    {layer.children.map(childLayer => (
                        <LayerItem
                            key={childLayer.id}
                            layer={childLayer}
                            onToggle={onToggle}
                            activeLayerIds={activeLayerIds}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default LayerItem;