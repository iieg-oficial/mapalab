import Lottie from 'lottie-react';
import spinnerAnimation from '@assets/Loading/spinner.json';

const LottieSpinner = ({ lottieRef, onDOMLoaded, onComplete, className, loop = false, autoplay = false }) => (
    <Lottie
        lottieRef={lottieRef}
        animationData={spinnerAnimation}
        loop={loop}
        autoplay={autoplay}
        onDOMLoaded={onDOMLoaded}
        onComplete={onComplete}
        className={className}
    />
);

export default LottieSpinner;
