import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@components/Logo', () => ({ default: () => <span /> }));

import LegendImage from '@components/LegendImage';

const cargar = (img, naturalWidth) => {
    Object.defineProperty(img, 'naturalWidth', { value: naturalWidth, configurable: true });
    fireEvent.load(img);
};

describe('LegendImage', () => {
    it('muestra la leyenda a su tamaño natural sin escala', () => {
        render(<LegendImage src="https://mapas.test/leyenda.png" alt="Escuelas" />);
        const img = screen.getByAltText('Leyenda de Escuelas');
        cargar(img, 160);
        expect(img.style.width).toBe('');
    });

    it('divide el ancho natural entre la escala para conservar el tamaño', () => {
        render(<LegendImage src="https://mapas.test/leyenda.png" alt="Escuelas" scale={2} />);
        const img = screen.getByAltText('Leyenda de Escuelas');
        expect(img.className).toContain('absolute');
        cargar(img, 293);
        expect(img.style.width).toBe('146.5px');
        expect(img.className).not.toContain('absolute');
    });
});
