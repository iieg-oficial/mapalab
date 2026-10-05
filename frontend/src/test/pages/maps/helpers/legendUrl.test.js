import { describe, it, expect } from 'vitest';
import { buildLegendGraphicUrl, legendVersionParam } from '@pages/maps/helpers/legendUrl';

const BASE = { baseUrl: '/sextante/raster/wms', layerName: 'raster:nddi' };

describe('legendVersionParam', () => {
    it('agrega lv cuando hay version', () => {
        expect(legendVersionParam(42)).toBe('&lv=42');
    });

    it('no agrega nada sin version', () => {
        expect(legendVersionParam(null)).toBe('');
        expect(legendVersionParam(undefined)).toBe('');
    });
});

describe('buildLegendGraphicUrl', () => {
    it('lleva la version de leyenda al final de la URL', () => {
        expect(buildLegendGraphicUrl({ ...BASE, legendVersion: 7 })).toMatch(/&lv=7$/);
    });

    it('subir la version cambia la URL, que es lo que esquiva la cache del gateway', () => {
        expect(buildLegendGraphicUrl({ ...BASE, legendVersion: 1 }))
            .not.toBe(buildLegendGraphicUrl({ ...BASE, legendVersion: 2 }));
    });

    it('sin version la URL queda como antes', () => {
        expect(buildLegendGraphicUrl(BASE)).not.toContain('&lv=');
    });
});
