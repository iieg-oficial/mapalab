import { getLayerTimePeriodicity } from '@services/wmsCapabilitiesService';

const VECTOR_TYPES = ['point', 'line', 'polygon'];

export const needsRasterPeriodicity = (node) => Boolean(
    node?.timeEnabled
    && !node.rasterPeriodicity
    && node.wmsConfig
    && !VECTOR_TYPES.includes(node.geometryType)
);

const collectPending = (nodes, sink = []) => {
    for (const node of nodes || []) {
        if (needsRasterPeriodicity(node)) sink.push(node);
        if (node.children?.length) collectPending(node.children, sink);
    }
    return sink;
};

const applyPeriodicities = (nodes, found) => {
    let changed = false;
    const next = nodes.map((node) => {
        const periodicity = found.get(node.id);
        const children = node.children?.length ? applyPeriodicities(node.children, found) : node.children;
        if (!periodicity && children === node.children) return node;
        changed = true;
        return { ...node, ...(periodicity ? { rasterPeriodicity: periodicity } : {}), children };
    });
    return changed ? next : nodes;
};

export const fillRasterPeriodicity = async (tree, fetchPeriodicity = getLayerTimePeriodicity) => {
    const pending = collectPending(tree);
    if (!pending.length) return tree;

    const results = await Promise.all(pending.map(async (node) => {
        try {
            return [node.id, await fetchPeriodicity(node.wmsConfig)];
        } catch {
            return [node.id, null];
        }
    }));

    const found = new Map(results.filter(([, periodicity]) => periodicity));
    if (!found.size) return tree;
    return applyPeriodicities(tree, found);
};
