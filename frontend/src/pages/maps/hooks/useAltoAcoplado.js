import { useCallback, useRef } from 'react';
import { limitarAlto } from '@pages/maps/helpers/tablaAcople';

export const useAltoAcoplado = (altoActual, fijarAlto) => {
    const origenRef = useRef(null);

    const alPresionar = useCallback((evento) => {
        if (evento.button !== 0) return;
        origenRef.current = {
            y: evento.clientY,
            alto: altoActual || Math.round(window.innerHeight * 0.4),
        };
        evento.currentTarget?.setPointerCapture?.(evento.pointerId);
        evento.preventDefault();
    }, [altoActual]);

    const alMover = useCallback((evento) => {
        const origen = origenRef.current;
        if (!origen) return;
        evento.preventDefault();
        fijarAlto(limitarAlto(origen.alto + (origen.y - evento.clientY), window.innerHeight));
    }, [fijarAlto]);

    const alSoltar = useCallback((evento) => {
        origenRef.current = null;
        evento.currentTarget?.releasePointerCapture?.(evento.pointerId);
    }, []);

    return {
        onPointerDown: alPresionar,
        onPointerMove: alMover,
        onPointerUp: alSoltar,
        onPointerCancel: alSoltar,
    };
};
