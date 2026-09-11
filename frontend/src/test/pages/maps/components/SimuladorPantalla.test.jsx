import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { store } = vi.hoisted(() => ({ store: { setPantalla: vi.fn() } }));

vi.mock('@services/devToolsStore', () => ({ devToolsStore: store }));
vi.mock('@components/Tooltip', () => ({ default: ({ children }) => children }));

import SimuladorPantalla from '@pages/maps/components/SimuladorPantalla';

describe('SimuladorPantalla', () => {
    beforeEach(() => {
        store.setPantalla.mockClear();
        window.innerWidth = 1440;
        window.innerHeight = 900;
    });

    it('muestra la app en un marco del ancho elegido, sin escalar si cabe', () => {
        window.innerHeight = 1000;
        render(<SimuladorPantalla clave="movil" />);
        const marco = screen.getByTitle(/MapaLab en Móvil/);
        expect(marco).toHaveAttribute('width', '390');
        expect(marco).toHaveAttribute('height', '844');
        expect(marco.style.transform).toBe('scale(1)');
        expect(screen.getByText('Móvil · 390 × 844')).toBeInTheDocument();
    });

    it('si la pantalla no cabe la reduce y dice a que porcentaje', () => {
        render(<SimuladorPantalla clave="escritorio" />);
        expect(screen.getByTitle(/MapaLab en Escritorio/)).toHaveAttribute('width', '1920');
        expect(screen.getByText(/Escritorio · 1920 × 1080 · al \d+ %/)).toBeInTheDocument();
    });

    it('cambiar de ancho no recarga el marco', () => {
        const { rerender } = render(<SimuladorPantalla clave="movil" />);
        const antes = screen.getByTitle(/MapaLab en/);
        rerender(<SimuladorPantalla clave="tablet" />);
        expect(screen.getByTitle(/MapaLab en/)).toBe(antes);
        expect(antes).toHaveAttribute('width', '768');
    });

    it('el segmented cambia de pantalla y Real apaga el simulador', () => {
        render(<SimuladorPantalla clave="movil" />);
        fireEvent.click(screen.getByRole('radio', { name: '1280' }));
        expect(store.setPantalla).toHaveBeenLastCalledWith('laptop');
        fireEvent.click(screen.getByRole('radio', { name: 'Real' }));
        expect(store.setPantalla).toHaveBeenLastCalledWith(null);
    });

    it('la X y Escape salen del simulador', () => {
        render(<SimuladorPantalla clave="movil" />);
        fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(store.setPantalla).toHaveBeenCalledTimes(2);
        expect(store.setPantalla).toHaveBeenLastCalledWith(null);
    });
});
