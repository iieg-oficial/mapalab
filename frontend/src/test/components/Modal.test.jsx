import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '@components/Modal';

vi.mock('@components/Icon', () => ({
    default: ({ name }) => <span data-testid={`icon-${name}`} />
}));

describe('Modal', () => {
    it('no renderiza nada cuando isOpen es false', () => {
        const { container } = render(<Modal isOpen={false} onClose={vi.fn()} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renderiza el contenido cuando isOpen es true', () => {
        render(<Modal isOpen={true} onClose={vi.fn()}><p>Contenido</p></Modal>);
        expect(screen.getByText('Contenido')).toBeInTheDocument();
    });

    it('muestra el título cuando se proporciona', () => {
        render(<Modal isOpen={true} onClose={vi.fn()} title="Mi Modal" />);
        expect(screen.getByText('Mi Modal')).toBeInTheDocument();
    });

    it('no muestra título si no se proporciona', () => {
        render(<Modal isOpen={true} onClose={vi.fn()} />);
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('tiene role="dialog" y aria-modal="true"', () => {
        render(<Modal isOpen={true} onClose={vi.fn()} title="Modal" />);
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('llama a onClose al hacer click en el backdrop', () => {
        const onClose = vi.fn();
        render(<Modal isOpen={true} onClose={onClose} />);
        const backdrop = document.querySelector('.absolute.inset-0');
        fireEvent.pointerDown(backdrop, { clientX: 100, clientY: 100 });
        fireEvent.pointerUp(backdrop, { clientX: 100, clientY: 100 });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('llama a onClose al presionar Escape', () => {
        const onClose = vi.fn();
        render(<Modal isOpen={true} onClose={onClose} />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('llama a onClose al hacer click en el botón de cerrar', () => {
        const onClose = vi.fn();
        render(<Modal isOpen={true} onClose={onClose} title="Modal" />);
        fireEvent.click(screen.getByLabelText('Cerrar modal'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('no muestra el botón de cerrar cuando showCloseButton es false', () => {
        render(<Modal isOpen={true} onClose={vi.fn()} title="Modal" showCloseButton={false} />);
        expect(screen.queryByLabelText('Cerrar modal')).not.toBeInTheDocument();
    });

    it('no muestra header cuando showHeader es false', () => {
        render(<Modal isOpen={true} onClose={vi.fn()} title="Modal" showHeader={false} />);
        expect(screen.queryByText('Modal')).not.toBeInTheDocument();
    });

    it('establece overflow hidden en body cuando está abierto', () => {
        render(<Modal isOpen={true} onClose={vi.fn()} />);
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('restaura overflow del body al cerrar', () => {
        const { rerender } = render(<Modal isOpen={true} onClose={vi.fn()} />);
        rerender(<Modal isOpen={false} onClose={vi.fn()} />);
        expect(document.body.style.overflow).toBe('unset');
    });
});
