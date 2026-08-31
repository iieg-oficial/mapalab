import { useLayoutEffect, useState } from 'react';
import { EVENTO_LAYOUT, avisarLayout } from '@hooks/useClearance';

const SEPARACION = 10;

export const useJuntoAPill = ({ propioRef, activo = true } = {}) => {
    const [desplazamiento, setDesplazamiento] = useState(null);

    useLayoutEffect(() => {
        if (!activo) {
            setDesplazamiento(null);
            return undefined;
        }

        const medir = () => {
            const propio = propioRef.current;
            if (!propio) return;

            const vecinas = Array.from(document.querySelectorAll('[data-pill-minimizada]'))
                .filter(nodo => !propio.contains(nodo))
                .map(nodo => nodo.getBoundingClientRect())
                .filter(caja => caja.width && caja.height);

            if (vecinas.length === 0) {
                setDesplazamiento(null);
                return;
            }

            const mia = propio.getBoundingClientRect();
            const encimadas = vecinas.filter(caja => mia.left < caja.right && mia.right > caja.left);
            if (encimadas.length === 0) return;

            const derecha = Math.max(...encimadas.map(caja => caja.right));
            const siguiente = Math.round(derecha - mia.left + SEPARACION);
            setDesplazamiento(previo => {
                if (previo === siguiente) return previo;
                requestAnimationFrame(avisarLayout);
                return siguiente;
            });
        };

        medir();
        const cuadro = requestAnimationFrame(medir);
        const observador = new ResizeObserver(() => requestAnimationFrame(medir));
        for (const nodo of document.querySelectorAll('[data-pill-minimizada]')) observador.observe(nodo);
        window.addEventListener('resize', medir);
        window.addEventListener(EVENTO_LAYOUT, medir);

        return () => {
            cancelAnimationFrame(cuadro);
            observador.disconnect();
            window.removeEventListener('resize', medir);
            window.removeEventListener(EVENTO_LAYOUT, medir);
        };
    }, [propioRef, activo]);

    return desplazamiento;
};
