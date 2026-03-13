import { useState, useEffect, useRef } from 'react';
import { useLayerLoading } from './useLayerLoading';

export const useSlowLoading = (threshold = 10000) => {
    const { loadingLayers } = useLayerLoading();
    const [isSlow, setIsSlow] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (loadingLayers.size > 0) {
            if (!timerRef.current) {
                timerRef.current = setTimeout(() => {
                    setIsSlow(true);
                }, threshold);
            }
        } else {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            setIsSlow(false);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [loadingLayers.size, threshold]);

    return isSlow;
};
