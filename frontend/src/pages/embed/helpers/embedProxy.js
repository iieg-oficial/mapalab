import { detectParentOrigin } from './postMessage';

const BACKEND_BASE = (import.meta.env.VITE_BACKEND_API_HOST || '/api/').replace(/\/+$/, '');


const buildEmbedWmsProxyUrl = () => `${BACKEND_BASE}/embed/wms-proxy`;


const proxifyNode = (node, proxyUrl, apiKey, parent) => {
    if (!node) return node;
    const proxiedWms = node.wmsConfig
        ? { ...node.wmsConfig, baseUrl: proxyUrl, _embedKey: apiKey, _embedParent: parent }
        : node.wmsConfig;
    const proxiedChildren = Array.isArray(node.children)
        ? node.children.map((c) => proxifyNode(c, proxyUrl, apiKey, parent))
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
    const parent = detectParentOrigin();
    return tree.map((node) => proxifyNode(node, proxyUrl, apiKey, parent));
};
