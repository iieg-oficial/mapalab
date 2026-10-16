import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

vi.mock('@components/SEO', () => ({ default: () => null }));
vi.mock('@components/Footer', () => ({ default: () => <footer /> }));
vi.mock('@components/Logo', () => ({ default: () => <span /> }));
vi.mock('@hooks/useThemeColor', () => ({ default: () => {} }));

import ConnectorPage from '@pages/connector/ConnectorPage';
import { TOOLS, buildMcpUrl } from '@pages/connector/config/connectorConfig';

const renderPage = () => render(<MemoryRouter><ConnectorPage /></MemoryRouter>);

describe('ConnectorPage', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue() }, configurable: true });
    });

    it('arma la URL del MCP con el origen y la ruta base', () => {
        expect(buildMcpUrl('https://iieg.jalisco.gob.mx')).toMatch(/^https:\/\/iieg\.jalisco\.gob\.mx.*\/mcp$/);
    });

    it('lista las herramientas de producción, sin el comparador', () => {
        renderPage();
        expect(screen.getByRole('heading', { name: `Herramientas (${TOOLS.length})` })).toBeTruthy();
        TOOLS.forEach((tool) => expect(screen.getByText(tool.name)).toBeTruthy());
        expect(TOOLS.some((tool) => tool.id === 'create_swipe')).toBe(false);
    });

    it('copia la URL y avisa que se copió', async () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: 'Copiar URL' }));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Copiada' })).toBeTruthy());
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(buildMcpUrl());
    });

    it('enlaza el correo de contacto', () => {
        renderPage();
        expect(screen.getByRole('link', { name: 'contacto@iieg.gob.mx' }).getAttribute('href')).toBe('mailto:contacto@iieg.gob.mx');
    });
});
