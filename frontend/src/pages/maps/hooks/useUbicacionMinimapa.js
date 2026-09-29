import { useEffect, useState } from 'react';
import { ubicarMinimapa } from '@pages/maps/helpers/minimapa';

const INTERVALO_MS = 400;

const cajasDe = selectores => selectores
    .flatMap(selector => [...document.querySelectorAll(selector)])
    .map(nodo => nodo.getBoundingClientRect())
    .filter(caja => caja.width && caja.height);

const igual = (a, b) => a === b || (a && b && a.abajo === b.abajo && a.derecha === b.derecha);

export const useUbicacionMinimapa = (activo, obstaculos, { base, borde, separacion }) => {
    const [ubicacion, setUbicacion] = useState(null);

    useEffect(() => {
        if (!activo) return undefined;
        const medir = () => {
            const siguiente = ubicarMinimapa({
                ancho: window.innerWidth,
                alto: window.innerHeight,
                cajas: cajasDe(obstaculos),
                base,
                borde,
                separacion,
            });
            setUbicacion(previa => (igual(previa, siguiente) ? previa : siguiente));
        };
        medir();
        const intervalo = setInterval(medir, INTERVALO_MS);
        window.addEventListener('resize', medir);
        return () => {
            clearInterval(intervalo);
            window.removeEventListener('resize', medir);
        };
    }, [activo, obstaculos, base, borde, separacion]);

    return activo ? ubicacion : null;
};
