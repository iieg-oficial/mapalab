import { useMemo } from 'react';
import Lottie from 'lottie-react';
import spinnerAnimation from '@assets/Loading/spinner.json';
import { recolorearLottie } from '@utils/lottieColor';

const LottieSpinner = ({ lottieRef, onDOMLoaded, onComplete, className, loop = false, autoplay = false, color = null }) => {
    const animacion = useMemo(() => recolorearLottie(spinnerAnimation, color), [color]);
    return (
        <Lottie
            lottieRef={lottieRef}
            animationData={animacion}
            loop={loop}
            autoplay={autoplay}
            onDOMLoaded={onDOMLoaded}
            onComplete={onComplete}
            className={className}
        />
    );
};

export default LottieSpinner;
