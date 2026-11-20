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

describe('recolorearLottie', () => {
    it('pinta rellenos y trazos, fijos y animados, sin tocar el original', async () => {
        const { recolorearLottie } = await import('@utils/lottieColor');
        const original = {
            layers: [{
                shapes: [
                    { ty: 'fl', c: { a: 0, k: [0.39, 0.12, 0.46, 1] } },
                    { ty: 'st', c: { a: 1, k: [{ t: 0, s: [0.9, 0.5, 0.2, 1] }, { t: 10, s: [1, 0, 0] }] } },
                    { ty: 'tr', c: { k: [0.1, 0.1, 0.1] } },
                ],
            }],
        };
        const blanco = recolorearLottie(original, '#FFFFFF');
        expect(blanco.layers[0].shapes[0].c.k).toEqual([1, 1, 1, 1]);
        expect(blanco.layers[0].shapes[1].c.k.map(c => c.s)).toEqual([[1, 1, 1, 1], [1, 1, 1, 1]]);
        expect(blanco.layers[0].shapes[2].c.k).toEqual([0.1, 0.1, 0.1]);
        expect(original.layers[0].shapes[0].c.k).toEqual([0.39, 0.12, 0.46, 1]);
        expect(recolorearLottie(original, null)).toBe(original);
    });
});
