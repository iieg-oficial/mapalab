import { describe, it, expect } from 'vitest';
import { createSidePanelSeleccion } from '@pages/maps/components/MapExport/utils/sidePanelSeleccion';

const filas = [
    { etiqueta: 'Área', valor: '5,829.45 km²' },
    { etiqueta: 'Escuelas', valor: '1,284', detalle: '0.22 / km²' },
];

describe('createSidePanelSeleccion', () => {
    it('arma el bloque con su título y una línea por dato', () => {
        const bloque = createSidePanelSeleccion(filas, 516, '8px 27px 8px 0', '12px');
        expect(bloque.textContent).toContain('Selección');
        expect(bloque.children).toHaveLength(filas.length + 1);
        expect(bloque.textContent).toContain('0.22 / km²');
    });

    it('sin datos no ocupa lugar en el panel', () => {
        expect(createSidePanelSeleccion([], 516, '0', '12px')).toBeNull();
        expect(createSidePanelSeleccion(null, 516, '0', '12px')).toBeNull();
    });
});
