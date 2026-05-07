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

        const scaleLine = new ScaleLine({
            target: containerRef.current,
            units: 'metric',
            bar: true,
            text: true,
            minWidth: 150
        });

        mapInstance.addControl(scaleLine);

        return () => {
            try {
                mapInstance.removeControl(scaleLine);
            } catch {
                /* mapa ya destruido */
            }
        };
    }, [mapInstance, containerRef]);
};
