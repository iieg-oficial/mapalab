import { useCallback } from 'react';

export const useLayerToggle = ({
    setActiveLayerIds,
    getAllChildLayerIds,
    findParent,
    findAllAncestors,
    getDirectChildIds
}) => {
    const handleToggleLayer = useCallback((layerId, isActive) => {
        setActiveLayerIds(prevActiveIds => {
            let updatedIds = [...prevActiveIds];

            if (isActive) {
                const childLayerIds = getAllChildLayerIds(layerId);
                const allIdsToAdd = [layerId, ...childLayerIds];

                updatedIds = updatedIds.filter(id => !allIdsToAdd.includes(id));
                updatedIds = [...allIdsToAdd, ...updatedIds];

                const parent = findParent(layerId);
                if (parent) {
                    const siblingIds = getDirectChildIds(parent.id);
                    const allSiblingsActive = siblingIds.every(siblingId =>
                        updatedIds.includes(siblingId)
                    );

                    if (allSiblingsActive && !updatedIds.includes(parent.id)) {
                        updatedIds = [parent.id, ...updatedIds.filter(id => !siblingIds.includes(id))];
                    }
                }
            } else {
                const parent = findParent(layerId);

                if (parent && prevActiveIds.includes(parent.id)) {
                    updatedIds = updatedIds.filter(id => id !== parent.id);

                    const siblingIds = getDirectChildIds(parent.id);

                    siblingIds.forEach(siblingId => {
                        if (siblingId !== layerId) {
                            if (!updatedIds.includes(siblingId)) {
                                updatedIds.push(siblingId);
                            }
                        }
                    });

                    const childLayerIds = getAllChildLayerIds(layerId);
                    updatedIds = updatedIds.filter(id => id !== layerId && !childLayerIds.includes(id));

                    const ancestors = findAllAncestors(layerId);
                    ancestors.forEach(ancestor => {
                        const ancestorChildIds = getDirectChildIds(ancestor.id);
                        const allAncestorChildrenActive = ancestorChildIds.every(childId =>
                            updatedIds.includes(childId)
                        );

                        if (!allAncestorChildrenActive && updatedIds.includes(ancestor.id)) {
                            updatedIds = updatedIds.filter(id => id !== ancestor.id);
                        }
                    });
                }
                else {
                    const idsToRemove = [layerId, ...getAllChildLayerIds(layerId)];
                    updatedIds = updatedIds.filter(id => !idsToRemove.includes(id));

                    const ancestors = findAllAncestors(layerId);
                    ancestors.forEach(ancestor => {
                        const ancestorChildIds = getDirectChildIds(ancestor.id);
                        const remainingSiblingsActive = ancestorChildIds.filter(childId =>
                            updatedIds.includes(childId)
                        );

                        if (remainingSiblingsActive.length < ancestorChildIds.length && updatedIds.includes(ancestor.id)) {
                            updatedIds = updatedIds.filter(id => id !== ancestor.id);
                            remainingSiblingsActive.forEach(siblingId => {
                                if (!updatedIds.includes(siblingId)) {
                                    updatedIds.push(siblingId);
                                }
                            });
                        }
                    });
                }
            }

            return updatedIds;
        });
    }, [setActiveLayerIds, getAllChildLayerIds, findParent, findAllAncestors, getDirectChildIds]);

    return { handleToggleLayer };
};