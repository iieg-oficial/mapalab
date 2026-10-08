import { describe, it, expect } from 'vitest';
import { fuenteHexbin, hexbinDisponible } from '@pages/catalogo/hooks/useCatalogoHexbin';
import { vistaDeParam } from '@pages/catalogo/helpers/catalogoVista';

describe('hexbinDisponible', () => {
    it('solo en capas de puntos que no son ráster', () => {
        const capa = { slug: 'escuelas' };
        expect(hexbinDisponible(capa, { geometria: 'point', isRaster: false })).toBe(true);
        expect(hexbinDisponible(capa, { geometria: 'polygon', isRaster: false })).toBe(false);
        expect(hexbinDisponible(capa, { geometria: 'point', isRaster: true })).toBe(false);
        expect(hexbinDisponible(capa, { geometria: null })).toBe(false);
        expect(hexbinDisponible(null, { geometria: 'point' })).toBe(false);
    });
});

describe('fuenteHexbin', () => {
    it('usa el precálculo solo con par y sin filtro', () => {
        expect(fuenteHexbin({ hexbinLayerKey: 'homicidio_doloso' }, null)).toBe('precalculado');
        expect(fuenteHexbin({ hexbinLayerKey: 'homicidio_doloso' }, "fecha >= '2025-01-01'")).toBe('navegador');
        expect(fuenteHexbin({ hexbinLayerKey: null }, null)).toBe('navegador');
        expect(fuenteHexbin({}, null)).toBe('navegador');
    });
});

describe('vistaDeParam', () => {
    it('cualquier valor que no sea hex es puntos', () => {
        expect(vistaDeParam('hex')).toBe('hex');
        expect(vistaDeParam(null)).toBe('puntos');
        expect(vistaDeParam('otra')).toBe('puntos');
    });
});
