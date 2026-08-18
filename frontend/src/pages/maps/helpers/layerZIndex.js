const PIN_Z_OFFSET = 9000;

export const computeLayerZIndex = ({ layerId, index, total, pinnedLayerIds, initialOrder }) => {
    if (pinnedLayerIds?.has(layerId)) {
        const order = initialOrder || [];
        const orderIdx = order.indexOf(layerId);
        const effectiveIdx = orderIdx === -1 ? order.length : orderIdx;
        return PIN_Z_OFFSET + (order.length - effectiveIdx);
    }
    return (total - index) + 100;
};
