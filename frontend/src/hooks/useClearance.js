import { useState, useRef, useLayoutEffect } from 'react';

const cajasDe = (obstaculos) => {
    const cajas = [];
    for (const obstaculo of obstaculos) {
        if (typeof obstaculo === 'string') {
            for (const nodo of document.querySelectorAll(obstaculo)) {
                cajas.push(nodo.getBoundingClientRect());
            }
        } else if (obstaculo?.current) {
            cajas.push(obstaculo.current.getBoundingClientRect());
        }
    }
    return cajas.filter(caja => caja.width && caja.height);
};

export const useClearance = (objetivoRef, {
    lado = 'top',
    obstaculos = [],
    base = 0,
    separacion = 16,
    activo = true,
} = {}) => {
    const [valor, setValor] = useState(base);
    const obstaculosRef = useRef(obstaculos);
    obstaculosRef.current = obstaculos;

    useLayoutEffect(() => {
        if (!activo) {
            setValor(base);
            return undefined;
        }

        const medir = () => {
            const nodo = objetivoRef.current;
            if (!nodo) return;
            const propio = nodo.getBoundingClientRect();
            if (!propio.width) return;

            const alto = window.innerHeight;
            const arriba = lado === 'top' ? base : alto - base - propio.height;
            const abajo = arriba + propio.height;

            let necesario = base;
            for (const caja of cajasDe(obstaculosRef.current)) {
                if (propio.left >= caja.right || propio.right <= caja.left) continue;
                if (arriba >= caja.bottom || abajo <= caja.top) continue;
                necesario = Math.max(
                    necesario,
                    lado === 'top' ? caja.bottom + separacion : alto - caja.top + separacion,
                );
            }

            const redondeado = Math.round(necesario);
            setValor(anterior => (anterior === redondeado ? anterior : redondeado));
        };

        medir();
        const id = requestAnimationFrame(medir);
        const observador = new ResizeObserver(() => requestAnimationFrame(medir));
        if (objetivoRef.current) observador.observe(objetivoRef.current);
        for (const obstaculo of obstaculosRef.current) {
            if (obstaculo?.current) observador.observe(obstaculo.current);
        }
        window.addEventListener('resize', medir);

        return () => {
            cancelAnimationFrame(id);
            observador.disconnect();
            window.removeEventListener('resize', medir);
        };
    }, [objetivoRef, lado, base, separacion, activo]);

    return valor;
};
