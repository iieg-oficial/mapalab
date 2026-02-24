import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Switch from '@components/Switch';

describe('Switch - render y aria', () => {
    it('tiene role="switch"', () => {
        render(<Switch checked={false} onChange={vi.fn()} />);
        expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('aria-checked es true cuando checked=true', () => {
        render(<Switch checked={true} onChange={vi.fn()} />);
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    it('aria-checked es false cuando checked=false', () => {
        render(<Switch checked={false} onChange={vi.fn()} />);
        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    });

    it('el botón está deshabilitado cuando disabled=true', () => {
        render(<Switch checked={false} onChange={vi.fn()} disabled={true} />);
        expect(screen.getByRole('switch')).toBeDisabled();
    });
});

describe('Switch - interacciones', () => {
    it('llama onChange con true al hacer click en switch desactivado', () => {
        const onChange = vi.fn();
        render(<Switch checked={false} onChange={onChange} />);
        fireEvent.click(screen.getByRole('switch'));
        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('llama onChange con false al hacer click en switch activado', () => {
        const onChange = vi.fn();
        render(<Switch checked={true} onChange={onChange} />);
        fireEvent.click(screen.getByRole('switch'));
        expect(onChange).toHaveBeenCalledWith(false);
    });

    it('no llama onChange cuando está deshabilitado', () => {
        const onChange = vi.fn();
        render(<Switch checked={false} onChange={onChange} disabled={true} />);
        fireEvent.click(screen.getByRole('switch'));
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('Switch - clases visuales', () => {
    it('aplica clase de fondo verde cuando checked=true', () => {
        render(<Switch checked={true} onChange={vi.fn()} />);
        const indicator = screen.getByRole('switch').querySelector('span');
        expect(indicator.className).toContain('bg-[#5AD344]');
    });

    it('aplica clase de fondo blanco cuando checked=false', () => {
        render(<Switch checked={false} onChange={vi.fn()} />);
        const indicator = screen.getByRole('switch').querySelector('span');
        expect(indicator.className).toContain('bg-white');
    });

    it('aplica clase de fondo naranja cuando indeterminate=true', () => {
        render(<Switch checked={false} indeterminate={true} onChange={vi.fn()} />);
        const indicator = screen.getByRole('switch').querySelector('span');
        expect(indicator.className).toContain('bg-[#FF8300]');
    });

    it('aplica clase de fondo gris cuando disabled=true', () => {
        render(<Switch checked={false} onChange={vi.fn()} disabled={true} />);
        const indicator = screen.getByRole('switch').querySelector('span');
        expect(indicator.className).toContain('bg-gray-300');
    });
});
