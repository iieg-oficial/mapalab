import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

function HelloWorld({ name = 'World' }) {
    return <h1>Hello {name}!</h1>;
}

describe('Example Test', () => {
    it('should render hello world', () => {
        render(<HelloWorld />);
        expect(screen.getByText('Hello World!')).toBeInTheDocument();
    });

    it('should render with custom name', () => {
        render(<HelloWorld name="Vitest" />);
        expect(screen.getByText('Hello Vitest!')).toBeInTheDocument();
    });

    it('should have correct heading level', () => {
        render(<HelloWorld />);
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
    });
});
