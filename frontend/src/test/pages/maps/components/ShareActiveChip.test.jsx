import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { enrutador, compartir, aplicar } = vi.hoisted(() => ({
    enrutador: { setSearchParams: vi.fn() },
    compartir: { fetchShare: vi.fn() },
    aplicar: vi.fn(),
}));

vi.mock('react-router', () => ({
    useSearchParams: () => [new URLSearchParams('s=k7Qm2x&layers=a'), enrutador.setSearchParams],
}));
vi.mock('@services/shareService', () => ({ fetchShare: (...args) => compartir.fetchShare(...args) }));
vi.mock('@pages/maps/hooks/useShareDeserializer', () => ({ useShareDeserializer: () => aplicar }));
vi.mock('@services/analyticsService', () => ({ trackShareMap: vi.fn() }));
vi.mock('@components/Tooltip', () => ({ default: ({ children }) => children }));

import ShareActiveChip from '@pages/maps/components/ShareActiveChip';

describe('ShareActiveChip', () => {
    beforeEach(() => {
        enrutador.setSearchParams.mockClear();
        aplicar.mockClear();
        compartir.fetchShare.mockReset();
    });

    it('sin cambios dice Compartido', () => {
        render(<ShareActiveChip loadedShareId="k7Qm2x" />);
        expect(screen.getByRole('button', { name: 'Compartido: k7Qm2x' })).toBeInTheDocument();
    });

    it('con cambios pasa a Regresar a', () => {
        render(<ShareActiveChip loadedShareId="k7Qm2x" isDirty />);
        expect(screen.getByRole('button', { name: 'Regresar a: k7Qm2x' })).toBeInTheDocument();
    });

    it('el clic restaura el enlace sin recargar la pagina y avisa que termino', async () => {
        const envelope = { version: 2, kind: 'single', payload: {} };
        compartir.fetchShare.mockResolvedValue(envelope);
        const onRestaurado = vi.fn();
        render(<ShareActiveChip loadedShareId="k7Qm2x" isDirty onRestaurado={onRestaurado} />);
        fireEvent.click(screen.getByRole('button', { name: 'Regresar a: k7Qm2x' }));
        await waitFor(() => expect(onRestaurado).toHaveBeenCalledTimes(1));
        expect(compartir.fetchShare).toHaveBeenCalledWith('k7Qm2x');
        expect(aplicar).toHaveBeenCalledWith(envelope);
    });

    it('si el enlace ya no existe no aplica nada', async () => {
        compartir.fetchShare.mockRejectedValue(new Error('404'));
        const onRestaurado = vi.fn();
        render(<ShareActiveChip loadedShareId="k7Qm2x" isDirty onRestaurado={onRestaurado} />);
        fireEvent.click(screen.getByRole('button', { name: 'Regresar a: k7Qm2x' }));
        await waitFor(() => expect(compartir.fetchShare).toHaveBeenCalled());
        expect(aplicar).not.toHaveBeenCalled();
        expect(onRestaurado).not.toHaveBeenCalled();
    });

    it('la X quita el enlace de la URL y conserva los demas parametros', () => {
        render(<ShareActiveChip loadedShareId="k7Qm2x" />);
        fireEvent.click(screen.getByRole('button', { name: 'Quitar enlace compartido' }));
        const [siguiente] = enrutador.setSearchParams.mock.calls[0];
        expect(siguiente.get('s')).toBeNull();
        expect(siguiente.get('layers')).toBe('a');
    });
});
