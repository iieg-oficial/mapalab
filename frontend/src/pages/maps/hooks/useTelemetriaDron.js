import { useEffect, useState } from 'react';
import { useDron } from '@contexts/DronContext';

export const useTelemetriaDron = (intervaloMs = 120) => {
    const { suscribir, telemetriaRef } = useDron();
    const [telemetria, setTelemetria] = useState(() => telemetriaRef.current);

    useEffect(() => {
        let ultimo = 0;
        return suscribir((valor) => {
            const ahora = performance.now();
            if (valor && ahora - ultimo < intervaloMs) return;
            ultimo = ahora;
            setTelemetria(valor);
        });
    }, [suscribir, intervaloMs]);

    return telemetria;
};

export const useLienzoDron = (lienzoRef, dibujar, activo = true) => {
    const { suscribir } = useDron();

    useEffect(() => {
        if (!activo) return undefined;
        const ctx = lienzoRef.current?.getContext('2d');
        if (!ctx) return undefined;
        return suscribir((valor) => { if (valor) dibujar(ctx, valor); });
    }, [suscribir, lienzoRef, dibujar, activo]);
};
