import { render, screen } from '@testing-library/react';
import Divider from '@components/Divider';
import { describe, it, expect } from 'vitest';

describe('Divider Component', () => {
    it('renders with default props', () => {
        render(<Divider />);
        const divider = screen.getByRole('separator');
        expect(divider).toBeInTheDocument();
        expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
        expect(divider).toHaveClass('w-full', 'h-px', 'bg-black/10', 'my-1', 'shrink-0');
    });

    it('renders vertical orientation', () => {
        render(<Divider orientation="vertical" />);
        const divider = screen.getByRole('separator');
        expect(divider).toHaveAttribute('aria-orientation', 'vertical');
        expect(divider).toHaveClass('h-full', 'w-px', 'bg-black/10', 'mx-1', 'shrink-0');
    });

    it('accepts custom className and props', () => {
        render(<Divider className="custom-class" data-testid="test-divider" />);
        const divider = screen.getByTestId('test-divider');
        expect(divider).toHaveClass('custom-class');
    });

    it('overrides default spacing when custom spacing class is provided', () => {
        render(<Divider className="my-4" />);
        const divider = screen.getByRole('separator');
        expect(divider).toHaveClass('my-4');
        expect(divider).not.toHaveClass('my-1');
    });

    it('overrides default color when custom bg class is provided', () => {
        render(<Divider className="bg-red-500" />);
        const divider = screen.getByRole('separator');
        expect(divider).toHaveClass('bg-red-500');
        expect(divider).not.toHaveClass('bg-black/10');
    });
});
