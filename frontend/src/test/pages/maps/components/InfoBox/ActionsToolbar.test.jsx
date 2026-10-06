import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@components/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@components/Icon', () => ({ default: ({ name }) => <span data-icono={name} /> }));

import ActionsToolbar from '@pages/maps/components/InfoBox/components/ActionsToolbar';

describe('ActionsToolbar', () => {
    it('ofrece descargar el mapa cuando la selección es un polígono', () => {
        const alDescargarMapa = vi.fn();
        render(<ActionsToolbar onDownload={() => {}} onDownloadMap={alDescargarMapa} />);

        fireEvent.click(screen.getByRole('button', { name: 'Descargar el mapa de esta selección' }));
        expect(alDescargarMapa).toHaveBeenCalledTimes(1);
    });

    it('sin polígono ese botón no aparece', () => {
        render(<ActionsToolbar onDownload={() => {}} />);
        expect(screen.queryByRole('button', { name: 'Descargar el mapa de esta selección' })).toBeNull();
    });
    it('caminar el instituto entra al recorrido', () => {
        const alCaminar = vi.fn();
        render(<ActionsToolbar onCaminar={alCaminar} />);
        fireEvent.click(screen.getByRole('button', { name: 'Caminar el instituto' }));
        expect(alCaminar).toHaveBeenCalledTimes(1);
    });

    it('sin WebGL2 el botón de caminar queda gris, dice por qué y no hace nada', () => {
        const alCaminar = vi.fn();
        render(<ActionsToolbar onCaminar={alCaminar} caminarDisponible={false} />);
        const boton = screen.getByRole('button', { name: 'Tu navegador no tiene WebGL2, necesario para caminar el instituto' });
        expect(boton).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(boton);
        expect(alCaminar).not.toHaveBeenCalled();
    });
});
