import { useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

export const useLayerSorting = (activeLayerIds, unifiedLayers, onReorder) => {
    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = unifiedLayers.findIndex(item => item.id === active.id);
        const newIndex = unifiedLayers.findIndex(item => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const itemsWithIds = unifiedLayers.map(layer => {
                const associatedIds = [layer.id, ...(layer.childIds || [])];
                return {
                    ...layer,
                    actualIds: activeLayerIds.filter(id => associatedIds.includes(id))
                };
            });

            const reorderedItems = arrayMove(itemsWithIds, oldIndex, newIndex);
            const newActiveLayerIds = reorderedItems.flatMap(item => item.actualIds);

            onReorder(newActiveLayerIds);
        }
    }, [activeLayerIds, unifiedLayers, onReorder]);

    return { handleDragEnd };
};
