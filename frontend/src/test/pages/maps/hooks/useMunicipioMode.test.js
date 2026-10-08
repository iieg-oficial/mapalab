import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@services/municipioService', () => ({
    fetchMunicipiosList: vi.fn(async () => [
        { clave: '14001', nombre: 'Acatic', region: 'Altos Sur' },
        { clave: '14002', nombre: 'Acatlán de Juárez', region: 'Valles' },
        { clave: '14003', nombre: 'Ahualulco de Mercado', region: 'Valles' },
    ]),
    fetchMunicipiosGeometries: vi.fn(async () => ({ items: [], unionBbox: null })),
}));

vi.mock('@services/analyticsService', () => ({
    trackMunicipioModeEnter: vi.fn(),
    trackMunicipioModeExit: vi.fn(),
    trackMunicipioSelectionChange: vi.fn(),
}));

const { useMunicipioMode, SCOPE_TYPES } = await import('@pages/maps/hooks/useMunicipioMode');

const ZMG = ['14039', '14120', '14098', '14101', '14097', '14070', '14051', '14044', '14124'];

const entrar = async (claves, opciones) => {
    const { result } = renderHook(() => useMunicipioMode({ activeLayerIds: [] }));
    await act(async () => { await result.current.enter(claves, { fromUrl: true, ...opciones }); });
    return result.current.scope;
};

describe('useMunicipioMode al restaurar', () => {
    it('respeta el scope guardado de una región', async () => {
        const scope = await entrar(['14002', '14003'], { scope: { type: 'region', value: 'Valles' } });
        expect(scope).toEqual({ type: SCOPE_TYPES.REGION, value: 'Valles' });
    });

    it('reconoce la ZMG aunque el payload no traiga scope', async () => {
        expect(await entrar(ZMG)).toEqual({ type: SCOPE_TYPES.ZMG, value: null });
    });

    it('un solo municipio sin scope queda como municipio', async () => {
        expect(await entrar(['14001'])).toEqual({ type: SCOPE_TYPES.MUNICIPIO, value: '14001' });
    });

    it('ignora un scope con tipo desconocido', async () => {
        expect(await entrar(['14001'], { scope: { type: 'estado', value: 'x' } }))
            .toEqual({ type: SCOPE_TYPES.MUNICIPIO, value: '14001' });
    });
});
