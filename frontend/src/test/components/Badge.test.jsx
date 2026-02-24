import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '@components/Badge';

describe('Badge - visibilidad', () => {
    it('renderiza el count cuando visible y count definido', () => {
        render(<Badge count={5} />);
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('no renderiza cuando visible=false', () => {
        const { container } = render(<Badge count={5} visible={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('no renderiza cuando count es undefined', () => {
        const { container } = render(<Badge visible={true} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('no renderiza cuando count es null', () => {
        const { container } = render(<Badge count={null} visible={true} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renderiza cuando count es 0', () => {
        render(<Badge count={0} />);
        expect(screen.getByText('0')).toBeInTheDocument();
    });
});

describe('Badge - clases', () => {
    it('aplica className extra', () => {
        render(<Badge count={3} className="extra-class" />);
        expect(screen.getByText('3').className).toContain('extra-class');
    });

    it('aplica clases base de estilo', () => {
        render(<Badge count={1} />);
        const el = screen.getByText('1');
        expect(el.className).toContain('bg-[#FF8300]');
        expect(el.className).toContain('rounded-full');
    });
});
