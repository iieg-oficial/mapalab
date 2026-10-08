import { describe, expect, it } from 'vitest';
import { classifyLayer, resolveTargetIds } from '@pages/maps/helpers/layers/aislarCapa';

const capa = (props) => ({ get: (k) => props[k] });

describe('classifyLayer', () => {
    it('una capa vectorial agrupada es objetivo si cualquiera de sus miembros lo es', () => {
        const hexbin = capa({ layerId: 'pozos', memberIds: ['pozos', 'pozos_profundos'] });
        expect(classifyLayer(hexbin, new Set(['pozos_profundos'])).role).toBe('target');
    });

    it('sin miembros en común es otra capa', () => {
        const hexbin = capa({ layerId: 'pozos', memberIds: ['pozos'] });
        expect(classifyLayer(hexbin, new Set(['presas'])).role).toBe('other');
    });

    it('una imagen WMS con parte del objetivo es mixta', () => {
        const wms = capa({ mergedLayers: [{ subLayers: [{ id: 'a' }] }, { subLayers: [{ id: 'b' }] }] });
        expect(classifyLayer(wms, new Set(['a']))).toEqual({ role: 'mixed', targetIdxs: [0] });
    });
});

describe('resolveTargetIds', () => {
    const arbol = [{ id: 'grupo', children: [{ id: 'hija', wmsConfig: { layerName: 'ws:hija' } }] }];

    it('incluye la capa misma además de sus capas WMS', () => {
        expect([...resolveTargetIds('grupo', arbol)].sort()).toEqual(['grupo', 'hija']);
    });

    it('una capa que no está en el árbol no tiene objetivo', () => {
        expect(resolveTargetIds('nada', arbol).size).toBe(0);
    });
});
