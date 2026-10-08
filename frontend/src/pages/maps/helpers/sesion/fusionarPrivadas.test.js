import { describe, expect, it } from 'vitest';
import { contarPrivadas, fusionarPrivadas } from './fusionarPrivadas';

const arbol = [
    { id: 'tema', sortOrder: 0, children: [
        { id: 'a', sortOrder: 0, children: [] },
        { id: 'c', sortOrder: 2, children: [] },
    ] },
];

describe('fusionarPrivadas', () => {
    it('sin complemento regresa el mismo árbol', () => {
        expect(fusionarPrivadas(arbol, [])).toBe(arbol);
    });

    it('cuelga el nodo de su padre en su lugar', () => {
        const nodo = { id: 'b', sortOrder: 1, privada: true, nodeType: 'leaf', children: [] };
        const resultado = fusionarPrivadas(arbol, [{ parentId: 'tema', node: nodo }]);
        expect(resultado[0].children.map((n) => n.id)).toEqual(['a', 'b', 'c']);
        expect(arbol[0].children).toHaveLength(2);
    });

    it('un tema privado entra como raíz', () => {
        const resultado = fusionarPrivadas(arbol, [{ parentId: null, node: { id: 'interno', sortOrder: 5, children: [] } }]);
        expect(resultado.map((n) => n.id)).toEqual(['tema', 'interno']);
    });

    it('si el padre no está, no lo agrega', () => {
        const resultado = fusionarPrivadas(arbol, [{ parentId: 'nada', node: { id: 'x', children: [] } }]);
        expect(resultado).toBe(arbol);
    });

    it('no duplica si ya estaba', () => {
        const nodo = { id: 'a', sortOrder: 0, privada: true, children: [] };
        const resultado = fusionarPrivadas(arbol, [{ parentId: 'tema', node: nodo }]);
        expect(resultado[0].children.filter((n) => n.id === 'a')).toHaveLength(1);
    });
});

describe('contarPrivadas', () => {
    it('cuenta solo hojas privadas', () => {
        const nodos = [{ id: 'g', privada: true, nodeType: 'category', children: [
            { id: 'h1', privada: true, nodeType: 'leaf' },
            { id: 'h2', privada: true, nodeType: 'leaf' },
        ] }, { id: 'p', nodeType: 'leaf' }];
        expect(contarPrivadas(nodos)).toBe(2);
    });
});
