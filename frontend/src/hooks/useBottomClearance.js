import { useEffect, useRef, useState } from 'react';

const SELECTORES = ['.ol-scale-line', '.ol-attribution'];

export const useBottomClearance = (objetivoRef, { base = 8, separacion = 8, activo = true } = {}) => {
    const [inferior, setInferior] = useState(base);
    const inferiorRef = useRef(base);

    useEffect(() => {
        if (!activo) {
            inferiorRef.current = base;
            setInferior(base);
            return undefined;
        }

        const medir = () => {
            const objetivo = objetivoRef.current;
            if (!objetivo) return;

            const propio = objetivo.getBoundingClientRect();
            if (!propio.width) return;

            let necesario = base;
            for (const selector of SELECTORES) {
                for (const nodo of document.querySelectorAll(selector)) {
                    const caja = nodo.getBoundingClientRect();
                    if (!caja.width || !caja.height) continue;
                    const seCruzanEnX = propio.left < caja.right && propio.right > caja.left;
                    if (!seCruzanEnX) continue;
                    necesario = Math.max(necesario, window.innerHeight - caja.top + separacion);
                }
            }

            const redondeado = Math.round(necesario);
            if (redondeado !== inferiorRef.current) {
                inferiorRef.current = redondeado;
                setInferior(redondeado);
            }
        };

        medir();
        const id = requestAnimationFrame(medir);
        const observador = new ResizeObserver(() => requestAnimationFrame(medir));
        if (objetivoRef.current) observador.observe(objetivoRef.current);
        window.addEventListener('resize', medir);

        return () => {
            cancelAnimationFrame(id);
            observador.disconnect();
            window.removeEventListener('resize', medir);
        };
    }, [objetivoRef, base, separacion, activo]);

    return inferior;
};
