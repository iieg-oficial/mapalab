const BACKEND_BASE = (import.meta.env.VITE_BACKEND_API_HOST || '/api/').replace(/\/+$/, '');


export const buildEmbedWmsProxyUrl = () => `${BACKEND_BASE}/embed/wms-proxy`;


const proxifyNode = (node, proxyUrl, apiKey) => {
    if (!node) return node;
    const proxiedWms = node.wmsConfig
        ? { ...node.wmsConfig, baseUrl: proxyUrl, _embedKey: apiKey }
        : node.wmsConfig;
    const proxiedChildren = Array.isArray(node.children)
        ? node.children.map((c) => proxifyNode(c, proxyUrl, apiKey))
        : node.children;
    return {
        ...node,
        wmsConfig: proxiedWms,
        children: proxiedChildren,
    };
};


export const proxifyLayerTree = (tree, apiKey) => {
    if (!apiKey || !Array.isArray(tree)) return tree;
    const proxyUrl = buildEmbedWmsProxyUrl();
    return tree.map((node) => proxifyNode(node, proxyUrl, apiKey));
};
