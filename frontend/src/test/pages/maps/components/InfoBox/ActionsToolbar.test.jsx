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
});
