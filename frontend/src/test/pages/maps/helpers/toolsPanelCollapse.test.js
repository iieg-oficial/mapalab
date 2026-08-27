import { describe, it, expect } from 'vitest';
import { resolveToolsCollapsed } from '@pages/maps/helpers/toolsPanelCollapse';

const caso = (extra) => resolveToolsCollapsed({ isMobile: false, esCompacto: false, preferencia: null, ...extra });

describe('resolveToolsCollapsed — sin preferencia guardada', () => {
    it('se contrae en pantallas por debajo del umbral', () => {
        expect(caso({ esCompacto: true })).toBe(true);
    });

    it('se expande en laptop y escritorio', () => {
        expect(caso({ esCompacto: false })).toBe(false);
    });
});

describe('resolveToolsCollapsed — con preferencia', () => {
    it('la preferencia de expandir gana en una tablet', () => {
        expect(caso({ esCompacto: true, preferencia: '0' })).toBe(false);
    });

    it('la preferencia de contraer gana en escritorio', () => {
        expect(caso({ esCompacto: false, preferencia: '1' })).toBe(true);
    });

    it('un valor basura en storage se trata como si no hubiera preferencia', () => {
        expect(caso({ esCompacto: true, preferencia: 'sí' })).toBe(true);
        expect(caso({ esCompacto: false, preferencia: '' })).toBe(false);
    });
});

describe('resolveToolsCollapsed — móvil', () => {
    it('en móvil siempre queda contraído, aunque la preferencia diga lo contrario', () => {
        expect(caso({ isMobile: true, preferencia: '0' })).toBe(true);
        expect(caso({ isMobile: true, esCompacto: false, preferencia: '0' })).toBe(true);
    });
});
