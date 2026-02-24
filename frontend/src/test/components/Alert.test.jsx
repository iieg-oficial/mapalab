import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Alert from '@components/Alert';

vi.mock('@components/Icon', () => ({
    default: ({ name }) => <span data-testid={`icon-${name}`} />
}));

describe('Alert - render básico', () => {
    it('renderiza el componente con severity info por defecto', () => {
        const { container } = render(<Alert />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('muestra el título cuando se proporciona', () => {
        render(<Alert title="Título de alerta" />);
        expect(screen.getByText('Título de alerta')).toBeInTheDocument();
    });

    it('no muestra heading cuando no hay título', () => {
        render(<Alert message="solo mensaje" />);
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('muestra el mensaje cuando se proporciona', () => {
        render(<Alert message="Mensaje de alerta" />);
        expect(screen.getByText('Mensaje de alerta')).toBeInTheDocument();
    });
});

describe('Alert - severity', () => {
    it('aplica clase info por defecto', () => {
        const { container } = render(<Alert />);
        expect(container.firstChild.className).toContain('bg-blue-50');
    });

    it('aplica clase warning', () => {
        const { container } = render(<Alert severity="warning" />);
        expect(container.firstChild.className).toContain('bg-amber-50');
    });

    it('aplica clase error', () => {
        const { container } = render(<Alert severity="error" />);
        expect(container.firstChild.className).toContain('bg-red-50');
    });

    it('aplica clase success', () => {
        const { container } = render(<Alert severity="success" />);
        expect(container.firstChild.className).toContain('bg-green-50');
    });

    it('usa iconName correcto por severity warning', () => {
        render(<Alert severity="warning" />);
        expect(screen.getByTestId('icon-alert')).toBeInTheDocument();
    });

    it('usa iconName correcto por severity success', () => {
        render(<Alert severity="success" />);
        expect(screen.getByTestId('icon-check')).toBeInTheDocument();
    });

    it('usa imagen cuando se proporciona iconSrc', () => {
        render(<Alert iconSrc="/img.png" severity="info" />);
        expect(screen.getByRole('img')).toBeInTheDocument();
        expect(screen.queryByTestId('icon-info')).not.toBeInTheDocument();
    });
});

describe('Alert - onClose', () => {
    it('muestra botón de cierre cuando se proporciona onClose', () => {
        render(<Alert onClose={vi.fn()} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('no muestra botón cuando no hay onClose', () => {
        render(<Alert />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('llama a onClose al hacer click', () => {
        const onClose = vi.fn();
        render(<Alert onClose={onClose} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('usa closeButtonLabel personalizado', () => {
        render(<Alert onClose={vi.fn()} closeButtonLabel="Dismiss" />);
        expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });
});
