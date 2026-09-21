import { describe, it, expect } from 'vitest';
import coordinateLabels from '@pages/maps/components/MapExport/utils/coordinateLabels';
import { EXPORT_DIMENSIONS } from '@pages/maps/components/MapExport/utils/exportDimensions';

const { LABEL_MARGIN_X, LABEL_MARGIN_Y } = EXPORT_DIMENSIONS;

describe('coordinateLabels', () => {
    it('cada franja mide lo mismo que el margen entre el borde y el marco, para centrar sus etiquetas', () => {
        const franjas = coordinateLabels(1961, 1646, [-104.5, 20.5, -103.5, 21.3]);
        expect(franjas.top.style.height).toBe(`${LABEL_MARGIN_X}px`);
        expect(franjas.bottom.style.height).toBe(`${LABEL_MARGIN_X}px`);
        expect(franjas.left.style.width).toBe(`${LABEL_MARGIN_Y}px`);
        expect(franjas.right.style.width).toBe(`${LABEL_MARGIN_Y}px`);
    });

    it('pone las coordenadas en kilómetros en las cuatro franjas', () => {
        const franjas = coordinateLabels(1961, 1646, [-104.5, 20.5, -103.5, 21.3]);
        expect(franjas.top.textContent).toMatch(/km/);
        expect(franjas.left.children.length).toBe(franjas.right.children.length);
    });
});
