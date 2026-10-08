import { useEffect } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { avisarLayout } from '@hooks/useClearance';

const DURACION_TRANSICION = 260;

export const useAcopleMapa = (acople) => {
    const { mapRef, paneMapInstances } = useMapsContext();

    useEffect(() => {
        const mapas = [mapRef?.current, ...Object.values(paneMapInstances || {})].filter(Boolean);
        if (mapas.length === 0) return undefined;

        let cuadro = null;
        const inicio = performance.now();

        const ajustar = () => {
            mapas.forEach(mapa => mapa.updateSize?.());
            if (performance.now() - inicio < DURACION_TRANSICION) {
                cuadro = requestAnimationFrame(ajustar);
            } else {
                avisarLayout();
            }
        };

        cuadro = requestAnimationFrame(ajustar);
        return () => { if (cuadro) cancelAnimationFrame(cuadro); };
    }, [acople, mapRef, paneMapInstances]);
};
