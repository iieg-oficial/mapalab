import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@components/Tooltip', () => ({ default: ({ children }) => children }));

import Segmented from '@components/Segmented';

const opciones = [
    { value: 'png', label: 'PNG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'gif', label: 'GIF', disabled: true },
];

describe('Segmented', () => {
    it('marca la opción elegida y avisa al cambiar', () => {
        const onChange = vi.fn();
        render(<Segmented variant="panel" ariaLabel="Formato" options={opciones} value="png" onChange={onChange} />);
        expect(screen.getByRole('radio', { name: 'PNG' })).toHaveAttribute('aria-checked', 'true');
        fireEvent.click(screen.getByRole('radio', { name: 'JPEG' }));
        expect(onChange).toHaveBeenCalledWith('jpeg');
    });

    it('una opción deshabilitada no se puede elegir', () => {
        const onChange = vi.fn();
        render(<Segmented variant="panel" ariaLabel="Formato" options={opciones} value="png" onChange={onChange} />);
        const gif = screen.getByRole('radio', { name: 'GIF' });
        expect(gif).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(gif);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('la variante panel ocupa todo el ancho y la de siempre no', () => {
        const { rerender } = render(<Segmented variant="panel" ariaLabel="Formato" options={opciones} value="png" />);
        expect(screen.getByRole('radiogroup')).toHaveClass('w-full');
        rerender(<Segmented ariaLabel="Formato" options={opciones} value="png" />);
        expect(screen.getByRole('radiogroup')).toHaveClass('rounded-full');
    });
});
