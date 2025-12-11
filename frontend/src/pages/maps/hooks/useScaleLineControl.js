import { useEffect, useRef, useState } from 'react';
import ScaleLine from 'ol/control/ScaleLine';

export const useScaleLineControl = (mapRef, containerRef) => {
    const scaleLineRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        if (!mapRef.current) {
            const checkInterval = setInterval(() => {
                if (mapRef.current) {
                    setMapReady(true);
                    clearInterval(checkInterval);
                }
            }, 50);

            return () => clearInterval(checkInterval);
        } else {
            setMapReady(true);
        }
    }, [mapRef]);

    useEffect(() => {
        if (!mapReady || !containerRef.current || scaleLineRef.current) return;

        const mapInstance = mapRef.current;
        const scaleLine = new ScaleLine({
            target: containerRef.current,
            units: 'metric',
            bar: true,
            text: true,
            minWidth: 100
        });

        mapInstance.addControl(scaleLine);
        scaleLineRef.current = scaleLine;

        return () => {
            const currentScaleLine = scaleLineRef.current;

            if (currentScaleLine && mapInstance) {
                mapInstance.removeControl(currentScaleLine);
                scaleLineRef.current = null;
            }
        };
    }, [mapReady, mapRef, containerRef]);
};
