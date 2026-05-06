import { render, screen } from '@testing-library/react';
import Text from '@mapsComponents/InfoBox/components/Text';
import { describe, it, expect } from 'vitest';

describe('Text Component', () => {
    it('renders label and value', () => {
        render(<Text label="Test Label" value="Test Value" />);
        expect(screen.getByText('Test Label')).toBeInTheDocument();
        expect(screen.getByText('Test Value')).toBeInTheDocument();
        expect(screen.getByText(':')).toBeInTheDocument();
    });

    it('renders without label', () => {
        render(<Text value="Only Value" />);
        expect(screen.getByText('Only Value')).toBeInTheDocument();
        expect(screen.queryByText(':')).not.toBeInTheDocument();
    });

    it('applies mobile sizing when variant is mobile', () => {
        const { container } = render(<Text label="M" value="V" variant="mobile" />);
        expect(container.firstChild).toHaveClass('text-[12px]');
    });

    it('applies desktop sizing by default', () => {
        const { container } = render(<Text label="D" value="V" />);
        expect(container.firstChild).toHaveClass('text-[10px]');
    });
});
