import { useEffect, useState } from 'react';

const INTERVALO_MS = 400;

const seEnciman = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

export const estaTapado = (propia, cajas) => cajas.some(caja => caja.width && caja.height && seEnciman(propia, caja));

export const useTapado = (ref, obstaculos, activo) => {
    const [tapado, setTapado] = useState(false);

    useEffect(() => {
        if (!activo) return undefined;
        const medir = () => {
            const nodo = ref.current;
            if (!nodo) return;
            const cajas = obstaculos.flatMap(selector => [...document.querySelectorAll(selector)]).map(el => el.getBoundingClientRect());
            const siguiente = estaTapado(nodo.getBoundingClientRect(), cajas);
            setTapado(previo => (previo === siguiente ? previo : siguiente));
        };
        medir();
        const intervalo = setInterval(medir, INTERVALO_MS);
        window.addEventListener('resize', medir);
        return () => {
            clearInterval(intervalo);
            window.removeEventListener('resize', medir);
        };
    }, [ref, obstaculos, activo]);

    return activo && tapado;
};
