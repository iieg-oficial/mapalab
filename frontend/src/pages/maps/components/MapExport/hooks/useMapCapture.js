import { useMapsContext } from '@hooks/useMaps';
import html2canvas from 'html2canvas';

export const useMapCapture = () => {
    const { targetRef } = useMapsContext();

    const prepareScaleControl = (scaleControl) => {
        if (!scaleControl) return null;

        const originalStyles = {
            left: scaleControl.style.left,
            bottom: scaleControl.style.bottom,
            right: scaleControl.style.right,
            top: scaleControl.style.top,
            transform: scaleControl.style.transform
        };

        scaleControl.style.left = 'auto';
        scaleControl.style.bottom = '15px';
        scaleControl.style.right = '330px';
        scaleControl.style.top = 'auto';
        scaleControl.style.transform = 'scale(1.5)';
        scaleControl.style.transformOrigin = 'bottom right';

        return originalStyles;
    };

    const restoreScaleControl = (scaleControl, originalStyles) => {
        if (!scaleControl || !originalStyles) return;
        scaleControl.style.left = originalStyles.left;
        scaleControl.style.bottom = originalStyles.bottom;
        scaleControl.style.right = originalStyles.right;
        scaleControl.style.top = originalStyles.top;
        scaleControl.style.transform = originalStyles.transform;
    };

    const waitForTilesToLoad = (maxWaitTime = 8000) => {
        return new Promise((resolve) => {
            const startTime = Date.now();

            const checkLoading = () => {
                const loadingElement = document.querySelector('.animate-spin');
                const isLoading = loadingElement !== null;

                if (!isLoading || Date.now() - startTime > maxWaitTime) {
                    setTimeout(resolve, 500);
                } else {
                    setTimeout(checkLoading, 200);
                }
            };

            setTimeout(checkLoading, 1000);
        });
    };

    const captureMap = async (scale = 2) => {
        if (!targetRef.current) return null;

        return html2canvas(targetRef.current, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            scale
        });
    };

    const captureElement = async (element, options = {}) => {
        if (!element) return null;

        return html2canvas(element, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            scale: 1,
            logging: false,
            ...options
        });
    };

    const waitForImages = async (container) => {
        const images = container.querySelectorAll('img');
        await Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        }));
    };

    return {
        prepareScaleControl,
        restoreScaleControl,
        waitForTilesToLoad,
        captureMap,
        captureElement,
        waitForImages
    };
};
