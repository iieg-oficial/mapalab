const porOrden = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

const insertar = (nodos, parentId, nodo) => {
    let insertado = false;
    const recorrer = (lista) => lista.map((n) => {
        if (insertado) return n;
        if (n.id === parentId) {
            insertado = true;
            return { ...n, children: [...(n.children || []).filter((h) => h.id !== nodo.id), nodo].sort(porOrden) };
        }
        if (!n.children?.length) return n;
        const hijos = recorrer(n.children);
        return hijos === n.children ? n : { ...n, children: hijos };
    });
    const resultado = recorrer(nodos);
    return { resultado, insertado };
};

export const fusionarPrivadas = (arbol, complemento) => {
    if (!Array.isArray(arbol) || !Array.isArray(complemento) || complemento.length === 0) return arbol;
    let actual = arbol;
    complemento.forEach(({ parentId, node }) => {
        if (!node?.id) return;
        if (parentId == null) {
            actual = [...actual.filter((n) => n.id !== node.id), node].sort(porOrden);
            return;
        }
        const { resultado, insertado } = insertar(actual, parentId, node);
        if (insertado) actual = resultado;
    });
    return actual;
};

export const contarPrivadas = (nodos) => (nodos || []).reduce(
    (total, n) => total + (n.privada && n.nodeType === 'leaf' ? 1 : 0) + contarPrivadas(n.children),
    0,
);
