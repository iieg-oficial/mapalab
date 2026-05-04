import { useEffect, useState } from 'react';
import ScaleLine from 'ol/control/ScaleLine';

export const useScaleLineControl = (getMapInstance, containerRef) => {
    const [mapInstance, setMapInstance] = useState(null);

    useEffect(() => {
        const sync = () => {
            const next = getMapInstance?.() ?? null;
            setMapInstance(prev => (prev === next ? prev : next));
        };
        sync();
        const interval = setInterval(sync, 100);
        return () => clearInterval(interval);
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
