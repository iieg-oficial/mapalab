import { describe, it, expect } from 'vitest';
import { canUseVectorService, SERVICE_WMS, SERVICE_VECTOR } from '@pages/maps/helpers/serviceMode';

const layer = (overrides = {}) => ({
    id: 'unidades_salud',
    geometryType: 'point',
    wmsConfig: { workspace: 'salud', layerName: 'salud:unidades_salud', wfsAvailable: true },
    ...overrides
});

describe('canUseVectorService', () => {
    it('acepta una capa vectorial con WFS', () => {
        expect(canUseVectorService(layer())).toBe(true);
        expect(canUseVectorService(layer({ geometryType: 'line' }))).toBe(true);
        expect(canUseVectorService(layer({ geometryType: 'polygon' }))).toBe(true);
    });

    it('rechaza la capa sin WFS publicado', () => {
        const wmsConfig = { workspace: 'salud', wfsAvailable: false };
        expect(canUseVectorService(layer({ wmsConfig }))).toBe(false);
    });

    it('rechaza las capas ráster por workspace y por geometría', () => {
        const wmsConfig = { workspace: 'lluvia', wfsAvailable: true };
        expect(canUseVectorService(layer({ wmsConfig }))).toBe(false);
        expect(canUseVectorService(layer({ geometryType: 'raster' }))).toBe(false);
    });

    it('rechaza la capa sin tipo de geometría', () => {
        expect(canUseVectorService(layer({ geometryType: null }))).toBe(false);
    });

    it('rechaza grupos, etiquetas y categorías', () => {
        expect(canUseVectorService(layer({ children: [{ id: 'hija' }] }))).toBe(false);
        expect(canUseVectorService(layer({ isLabel: true }))).toBe(false);
        expect(canUseVectorService(layer({ isCategory: true }))).toBe(false);
    });

    it('rechaza el nodo sin wmsConfig y el nodo inexistente', () => {
        expect(canUseVectorService(layer({ wmsConfig: null }))).toBe(false);
        expect(canUseVectorService(null)).toBe(false);
    });

    it('mantiene distintos los dos modos', () => {
        expect(SERVICE_WMS).not.toBe(SERVICE_VECTOR);
    });
});
