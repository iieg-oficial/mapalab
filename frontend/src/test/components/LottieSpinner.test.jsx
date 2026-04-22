import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import LottieSpinner from '@components/LottieSpinner';

vi.mock('lottie-react', () => ({
    default: ({ className }) => <div data-testid="lottie-mock" className={className} />
}));

describe('LottieSpinner', () => {
    it('renderiza el componente Lottie con la clase pasada', () => {
        const { getByTestId } = render(<LottieSpinner className="custom-class" />);
        const el = getByTestId('lottie-mock');
        expect(el).toBeInTheDocument();
        expect(el).toHaveClass('custom-class');
    });

    it('acepta lottieRef sin crashear', () => {
        const ref = createRef();
        const { getByTestId } = render(<LottieSpinner lottieRef={ref} />);
        expect(getByTestId('lottie-mock')).toBeInTheDocument();
    });
});
