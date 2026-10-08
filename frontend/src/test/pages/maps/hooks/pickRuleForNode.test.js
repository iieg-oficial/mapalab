import { describe, it, expect, vi } from 'vitest';

vi.mock('@hooks/useLayers', () => ({ useLayers: () => ({ layers: [] }) }));
vi.mock('@hooksMaps/useWMSLegend', () => ({ useWMSLegend: () => ({}) }));

import { pickRuleForNode } from '@hooksMaps/useLayerSymbolIcon';

const REGLAS = [
    { name: 'Primer nivel', filter: "[nivel_atencion = 'Primer nivel']" },
    { name: 'Segundo nivel', filter: "[nivel_atencion = 'Segundo nivel']" },
    { name: 'Tercer nivel', filter: "[nivel_atencion = 'Tercer nivel']" },
    { name: 'Otros / No aplica', filter: "[nivel_atencion = 'No aplica']" }
];

describe('pickRuleForNode', () => {
    it('casa la regla por el nombre del nodo', () => {
        const nodo = { label: 'Segundo nivel' };
        expect(pickRuleForNode(REGLAS, nodo).name).toBe('Segundo nivel');
    });

    it('ignora acentos y mayúsculas al casar', () => {
        expect(pickRuleForNode(REGLAS, { label: 'TERCER NIVEL' }).name).toBe('Tercer nivel');
    });

    it('cae al filtro CQL del nodo cuando el nombre no coincide', () => {
        const nodo = { label: 'Hospitales', wmsConfig: { cqlFilter: "nivel_atencion = 'Tercer nivel'" } };
        expect(pickRuleForNode(REGLAS, nodo).name).toBe('Tercer nivel');
    });

    it('usa la primera regla cuando nada coincide', () => {
        expect(pickRuleForNode(REGLAS, { label: 'Otra cosa' }).name).toBe('Primer nivel');
    });

    it('con una sola regla devuelve esa', () => {
        const una = [{ name: 'Todo' }];
        expect(pickRuleForNode(una, { label: 'Cualquiera' }).name).toBe('Todo');
    });

    it('sin reglas devuelve null', () => {
        expect(pickRuleForNode([], { label: 'x' })).toBe(null);
        expect(pickRuleForNode(null, { label: 'x' })).toBe(null);
    });
});
