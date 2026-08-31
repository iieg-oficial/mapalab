import { useCallback, useRef, useState } from 'react';

const limitar = (valor, minimo, maximo) => Math.min(Math.max(valor, minimo), maximo);

export const useArrastreVentana = (inicial) => {
    const [posicion, setPosicion] = useState(inicial);
    const origenRef = useRef(null);

    const alMover = useCallback((evento) => {
        const origen = origenRef.current;
        if (!origen) return;
        const ancho = window.innerWidth;
        const alto = window.innerHeight;
        setPosicion({
            x: limitar(origen.x + evento.clientX - origen.clienteX, 0, Math.max(ancho - 220, 0)),
            y: limitar(origen.y + evento.clientY - origen.clienteY, 0, Math.max(alto - 120, 0)),
        });
    }, []);

    const alSoltar = useCallback((evento) => {
        origenRef.current = null;
        evento.currentTarget?.releasePointerCapture?.(evento.pointerId);
    }, []);

    const alPresionar = useCallback((evento) => {
        if (evento.button !== 0) return;
        origenRef.current = {
            x: posicion.x,
            y: posicion.y,
            clienteX: evento.clientX,
            clienteY: evento.clientY,
        };
        evento.currentTarget?.setPointerCapture?.(evento.pointerId);
    }, [posicion]);

    return {
        posicion,
        setPosicion,
        manejadores: {
            onPointerDown: alPresionar,
            onPointerMove: alMover,
            onPointerUp: alSoltar,
            onPointerCancel: alSoltar,
        },
    };
};
