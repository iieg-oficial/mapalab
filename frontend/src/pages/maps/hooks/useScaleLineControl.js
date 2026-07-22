import { useEffect, useState } from 'react';
import ScaleLine from 'ol/control/ScaleLine';

const POLL_MS = 250;

export const useScaleLineControl = (getMapInstance, containerRef) => {
    const [mapInstance, setMapInstance] = useState(null);

    useEffect(() => {
        let intervalId = null;

        const sync = () => {
            const next = getMapInstance?.() ?? null;
            setMapInstance(prev => (prev === next ? prev : next));
            if (next && intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        sync();
        if ((getMapInstance?.() ?? null) === null) {
            intervalId = setInterval(sync, POLL_MS);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [getMapInstance]);

    useEffect(() => {
        if (!mapInstance || !containerRef.current) return;

        let scaleLine = null;

        const createControl = () => {
            if (scaleLine) {
                try {
                    mapInstance.removeControl(scaleLine);
                } catch {
                    /* control ya removido */
                }
            }
            const isMobile = window.innerWidth < 768;
            const options = {
                target: containerRef.current,
                units: 'metric',
                bar: true,
                text: true,
                minWidth: isMobile ? 80 : 150,
            };
            if (isMobile) {
                options.maxWidth = Math.round(window.innerWidth * 0.5);
            }
            scaleLine = new ScaleLine(options);
            mapInstance.addControl(scaleLine);
        };

        createControl();

        let rafId = null;
        const handleResize = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(createControl);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (rafId) cancelAnimationFrame(rafId);
            try {
                if (scaleLine) mapInstance.removeControl(scaleLine);
            } catch {
                /* mapa ya destruido */
            }
        };
    }, [mapInstance, containerRef]);
};
