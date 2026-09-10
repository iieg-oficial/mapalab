import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

const { entorno, colibri } = vi.hoisted(() => ({
    entorno: { noProd: false },
    colibri: vi.fn(() => true),
}));

vi.mock('@hooks/useDevTools', () => ({ useIsNonProd: () => entorno.noProd }));
vi.mock('@hooks/useColibriOpen', () => ({ useColibriOpen: () => colibri }));
vi.mock('@components/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@components/Logo', () => ({ default: () => <span data-testid="logo-carga" /> }));
vi.mock('@components/BrandedQr', () => ({ default: () => <div data-testid="qr" /> }));

import SharePanel from '@pages/maps/components/SharePanel';

const enlaceBase = {
    share: null,
    url: null,
    error: null,
    copied: false,
    includeAnnotations: true,
    annotationsCount: 0,
    ensureShare: vi.fn(),
    copyLink: vi.fn(),
    alternarAnotaciones: vi.fn(),
    marcarFijado: vi.fn(),
};

const listo = {
    ...enlaceBase,
    share: { id: 'k7Qm2x' },
    url: 'https://iieg.jalisco.gob.mx/mapalab/mapa?s=k7Qm2x',
};

const avanzar = (ms) => act(() => { vi.advanceTimersByTime(ms); });

describe('SharePanel — carga diferida', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('no muestra el loader si el enlace llega antes de 300 ms', () => {
        const { rerender } = render(<SharePanel link={enlaceBase} />);
        avanzar(299);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        rerender(<SharePanel link={listo} />);
        avanzar(500);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Enlace del mapa')).toHaveValue('k7Qm2x');
    });

    it('muestra el logo animado cuando la generacion tarda', () => {
        render(<SharePanel link={enlaceBase} />);
        avanzar(300);
        expect(screen.getByRole('status')).toHaveAccessibleName('Generando enlace');
        expect(screen.getByTestId('logo-carga')).toBeInTheDocument();
    });
});

describe('SharePanel — con el enlace listo', () => {
    beforeEach(() => {
        entorno.noProd = false;
        colibri.mockClear();
    });

    it('muestra el QR y las cinco redes', () => {
        render(<SharePanel link={listo} />);
        expect(screen.getByTestId('qr')).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /Compartir en/ })).toHaveLength(5);
    });

    it('el input muestra solo el hash y el enlace completo al enfocarlo', () => {
        render(<SharePanel link={listo} />);
        const campo = screen.getByLabelText('Enlace del mapa');
        expect(campo).toHaveValue('k7Qm2x');
        fireEvent.focus(campo);
        expect(campo).toHaveValue(listo.url);
        fireEvent.blur(campo);
        expect(campo).toHaveValue('k7Qm2x');
    });

    it('la X cierra el panel sin pedir confirmacion', () => {
        const onCerrar = vi.fn();
        render(<SharePanel link={listo} onCerrar={onCerrar} />);
        fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
        expect(onCerrar).toHaveBeenCalledTimes(1);
    });

    it('tocar el QR revela la descarga, y volver a tocarlo la oculta', () => {
        render(<SharePanel link={listo} />);
        const capa = screen.getByRole('button', { name: 'Descargar PNG' }).parentElement;
        expect(capa.className).toContain('opacity-0');
        fireEvent.click(screen.getByRole('button', { name: 'Mostrar opciones del código QR' }));
        expect(capa.className).toContain('opacity-100');
        fireEvent.click(screen.getByRole('button', { name: 'Mostrar opciones del código QR' }));
        expect(capa.className).toContain('opacity-0');
    });

    it('insertar no aparece fuera de dev y beta', () => {
        render(<SharePanel link={listo} />);
        expect(screen.queryByText(/Insertar en otra página/)).not.toBeInTheDocument();
    });

    it('en beta, insertar despliega el codigo y pide la llave por Colibri', () => {
        entorno.noProd = true;
        render(<SharePanel link={listo} />);
        fireEvent.click(screen.getByText(/Insertar en otra página/));
        expect(screen.getByText(/share="k7Qm2x"/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Solicítala/ }));
        expect(colibri).toHaveBeenCalledWith(
            { motivo: 'solicitud_api_key', share_id: 'k7Qm2x' },
            { tipoDefault: 'solicitud', tipos: 'solicitud', emailRequired: true },
        );
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('si Colibri no cargo, lo dice en pantalla en vez de fallar callado', () => {
        entorno.noProd = true;
        colibri.mockReturnValueOnce(false);
        render(<SharePanel link={listo} />);
        fireEvent.click(screen.getByText(/Insertar en otra página/));
        fireEvent.click(screen.getByRole('button', { name: /Solicítala/ }));
        expect(screen.getByRole('alert')).toHaveTextContent(/no cargó/);
    });
});
