import { useMemo, useCallback, useState } from 'react';
import Switch from '@components/Switch';
import Checkbox from '@components/Checkbox';
import { HIDDEN_SCROLLBAR } from '@constants/global';

const LayerItem = ({ layer, onToggle, activeLayerIds, depth = 0 }) => {
    const isActive = activeLayerIds.includes(layer.id);
    const hasChildren = layer.children && layer.children.length > 0;
    const isTopLevel = depth === 0;
    const [isManuallyExpanded, setIsManuallyExpanded] = useState(layer.isCategory);

    const getAllDescendantIds = useCallback((layer) => {
        const ids = [];
        if (layer.children) {
            layer.children.forEach(child => {
                if (!child.isLabel) {
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

        const directChildIds = layer.children.filter(child => !child.isLabel).map(child => child.id);
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
        <div className={HIDDEN_SCROLLBAR}>
            <div
                className={`
                    flex items-start px-4 w-full ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} 
                `}
            >
                {useSwitch ? (
                    <Switch
                        checked={switchChecked}
                        indeterminate={switchIndeterminate}
                        onChange={handleSwitchChange}
                        disabled={isDisabled}
                        className="mr-2 mt-1"
                    />
                ) : (
                    <Checkbox
                        checked={isActive}
                        onChange={handleCheckboxClick}
                        disabled={isDisabled}
                        className="mt-2"
                    />
                )}
                <span
                    className={`
                        flex-grow font-garet font-normal text-[12px] my-1.5 text-[#454545] tracking-normal
                        ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    onClick={handleLabelClick}
                >
                    {layer.label}
                </span>
            </div>

            {isExpanded && (
                <div className={`pl-6 ${HIDDEN_SCROLLBAR}`}>
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