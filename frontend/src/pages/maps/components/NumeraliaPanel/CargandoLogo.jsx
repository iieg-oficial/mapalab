import { lazy, Suspense } from 'react';

const LottieSpinner = lazy(() => import('@components/LottieSpinner'));

const CargandoLogo = ({ className = 'size-5', etiqueta = 'Calculando', color = null }) => (
    <span role="status" aria-label={etiqueta} className={`inline-flex shrink-0 ${className}`}>
        <Suspense fallback={null}>
            <LottieSpinner loop autoplay color={color} className="size-full" />
        </Suspense>
    </span>
);

export default CargandoLogo;
