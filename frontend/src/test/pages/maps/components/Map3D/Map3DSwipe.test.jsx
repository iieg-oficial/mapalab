import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ ctx: null, refs: [] }));

vi.mock('@hooks/useMaps', () => ({ useMapsContext: () => mocks.ctx }));
vi.mock('@pages/maps/components/Map3D/Map3DView', () => ({
    default: ({ olMapRef, principal }) => {
        mocks.refs.push({ olMapRef, principal });
        return null;
    },
}));

import Map3DSwipe from '@pages/maps/components/Map3D/Map3DSwipe';

describe('Map3DSwipe', () => {
    it('conserva la referencia de cada lado aunque el registro de panes cambie de identidad', () => {
        const alfa = { id: 'alfa' };
        const beta = { id: 'beta' };
        mocks.ctx = { paneMapInstances: { 0: alfa, 1: beta } };
        const { rerender } = render(<Map3DSwipe />);
        const [primeraA, primeraB] = mocks.refs.slice(-2);
        mocks.ctx = { paneMapInstances: { 0: alfa, 1: beta } };
        rerender(<Map3DSwipe />);
        const [segundaA, segundaB] = mocks.refs.slice(-2);
        expect(segundaA.olMapRef).toBe(primeraA.olMapRef);
        expect(segundaB.olMapRef).toBe(primeraB.olMapRef);
        expect(primeraA.principal).toBe(true);
        expect(primeraB.principal).toBe(false);
    });

    it('cambia la referencia solo del lado cuyo mapa cambio', () => {
        const alfa = { id: 'alfa' };
        mocks.ctx = { paneMapInstances: { 0: alfa, 1: { id: 'beta' } } };
        const { rerender } = render(<Map3DSwipe />);
        const [primeraA, primeraB] = mocks.refs.slice(-2);
        mocks.ctx = { paneMapInstances: { 0: alfa, 1: { id: 'beta-nuevo' } } };
        rerender(<Map3DSwipe />);
        const [segundaA, segundaB] = mocks.refs.slice(-2);
        expect(segundaA.olMapRef).toBe(primeraA.olMapRef);
        expect(segundaB.olMapRef).not.toBe(primeraB.olMapRef);
        expect(segundaB.olMapRef.current.id).toBe('beta-nuevo');
    });
});
