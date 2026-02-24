import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Checkbox from '@components/Checkbox';

vi.mock('@components/Icon', () => ({
    default: ({ name }) => <span data-testid={`icon-${name}`} />
}));

describe('Checkbox - render y aria', () => {
    it('tiene role="checkbox"', () => {
        render(<Checkbox checked={false} onChange={vi.fn()} />);
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('aria-checked es true cuando checked=true', () => {
        render(<Checkbox checked={true} onChange={vi.fn()} />);
        expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
    });

    it('aria-checked es false cuando checked=false', () => {
        render(<Checkbox checked={false} onChange={vi.fn()} />);
        expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
    });

    it('está deshabilitado cuando disabled=true', () => {
        render(<Checkbox checked={false} onChange={vi.fn()} disabled={true} />);
        expect(screen.getByRole('checkbox')).toBeDisabled();
    });
});

describe('Checkbox - interacciones', () => {
    it('llama a onChange al hacer click cuando no está deshabilitado', () => {
        const onChange = vi.fn();
        render(<Checkbox checked={false} onChange={onChange} />);
        fireEvent.click(screen.getByRole('checkbox'));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('no llama a onChange cuando está deshabilitado', () => {
        const onChange = vi.fn();
        render(<Checkbox checked={false} onChange={onChange} disabled={true} />);
        fireEvent.click(screen.getByRole('checkbox'));
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('Checkbox - ícono de check', () => {
    it('muestra el ícono de check cuando checked=true y no disabled', () => {
        render(<Checkbox checked={true} onChange={vi.fn()} />);
        expect(screen.getByTestId('icon-check')).toBeInTheDocument();
    });

    it('no muestra el ícono cuando checked=false', () => {
        render(<Checkbox checked={false} onChange={vi.fn()} />);
        expect(screen.queryByTestId('icon-check')).not.toBeInTheDocument();
    });

    it('no muestra el ícono cuando checked=true pero disabled=true', () => {
        render(<Checkbox checked={true} onChange={vi.fn()} disabled={true} />);
        expect(screen.queryByTestId('icon-check')).not.toBeInTheDocument();
    });
});

describe('Checkbox - clases visuales', () => {
    it('aplica fondo púrpura cuando checked=true', () => {
        render(<Checkbox checked={true} onChange={vi.fn()} />);
        expect(screen.getByRole('checkbox').className).toContain('bg-[#703089]');
    });

    it('aplica fondo claro cuando checked=false', () => {
        render(<Checkbox checked={false} onChange={vi.fn()} />);
        expect(screen.getByRole('checkbox').className).toContain('bg-[#EAEFFA]');
    });

    it('aplica fondo gris cuando disabled=true', () => {
        render(<Checkbox checked={false} onChange={vi.fn()} disabled={true} />);
        expect(screen.getByRole('checkbox').className).toContain('bg-[#E9EDF7]');
    });
});
