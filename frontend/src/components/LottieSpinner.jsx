import Lottie from 'lottie-react';
import spinnerAnimation from '@assets/Loading/spinner.json';

const LottieSpinner = ({ lottieRef, onDOMLoaded, onComplete, className }) => (
    <Lottie
        lottieRef={lottieRef}
        animationData={spinnerAnimation}
        loop={false}
        autoplay={false}
        onDOMLoaded={onDOMLoaded}
        onComplete={onComplete}
        className={className}
    />
);

export default LottieSpinner;
