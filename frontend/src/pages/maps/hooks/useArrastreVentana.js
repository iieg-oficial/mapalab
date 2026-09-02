import { useCallback, useRef, useState } from 'react';
import { zonaDeSnap } from '@pages/maps/helpers/tablaAcople';

const limitar = (valor, minimo, maximo) => Math.min(Math.max(valor, minimo), maximo);

const ANCHO_VENTANA = 760;
const ALTO_VENTANA = 420;

export const posicionCentrada = (indice = 0) => {
    if (typeof window === 'undefined') return { x: 80, y: 80 };
    const ancho = Math.min(ANCHO_VENTANA, window.innerWidth * 0.92);
    const alto = Math.min(ALTO_VENTANA, window.innerHeight * 0.6);
    const desfase = indice * 26;
    return {
        x: limitar(Math.round((window.innerWidth - ancho) / 2) + desfase, 8, Math.max(window.innerWidth - 220, 8)),
        y: limitar(Math.round((window.innerHeight - alto) / 2) + desfase, 8, Math.max(window.innerHeight - 120, 8)),
    };
};

export const useArrastreVentana = (inicial, onSoltarEnZona) => {
    const [posicion, setPosicion] = useState(inicial);
    const [zona, setZona] = useState(null);
    const origenRef = useRef(null);
    const zonaRef = useRef(null);

    const alMover = useCallback((evento) => {
        const origen = origenRef.current;
        if (!origen) return;
        evento.preventDefault();
        const ancho = window.innerWidth;
        const alto = window.innerHeight;
        setPosicion({
            x: limitar(origen.x + evento.clientX - origen.clienteX, 0, Math.max(ancho - 220, 0)),
            y: limitar(origen.y + evento.clientY - origen.clienteY, 0, Math.max(alto - 120, 0)),
        });

        const siguiente = zonaDeSnap({ y: evento.clientY, alto });
        if (siguiente !== zonaRef.current) {
            zonaRef.current = siguiente;
            setZona(siguiente);
        }
    }, []);

    const alSoltar = useCallback((evento) => {
        const arrastraba = Boolean(origenRef.current);
        origenRef.current = null;
        evento.currentTarget?.releasePointerCapture?.(evento.pointerId);

        if (arrastraba && zonaRef.current) onSoltarEnZona?.(zonaRef.current);
        zonaRef.current = null;
        setZona(null);
    }, [onSoltarEnZona]);

    const alPresionar = useCallback((evento) => {
        if (evento.button !== 0) return;
        if (evento.target?.closest?.('button, input, select, textarea, a')) return;
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
        zona,
        manejadores: {
            onPointerDown: alPresionar,
            onPointerMove: alMover,
            onPointerUp: alSoltar,
            onPointerCancel: alSoltar,
        },
    };
};
