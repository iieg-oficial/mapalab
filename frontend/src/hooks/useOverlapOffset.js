import { useState, useRef, useLayoutEffect } from 'react';

export const useOverlapOffset = (objetivoRef, obstaculoRef, { separacion = 16, activo = true } = {}) => {
    const [desplazamiento, setDesplazamiento] = useState(0);
    const desplazamientoRef = useRef(0);

    useLayoutEffect(() => {
        if (!activo) {
            desplazamientoRef.current = 0;
            setDesplazamiento(0);
            return;
        }

        const medir = () => {
            const objetivo = objetivoRef.current;
            const obstaculo = obstaculoRef.current;
            if (!objetivo || !obstaculo) return;

            const a = objetivo.getBoundingClientRect();
            const b = obstaculo.getBoundingClientRect();
            if (!b.width || !b.height) return;

            const arriba = a.top - desplazamientoRef.current;
            const seCruzan = a.left < b.right && a.right > b.left
                && arriba < b.bottom && arriba + a.height > b.top;
            const siguiente = seCruzan ? Math.max(0, Math.round(b.bottom + separacion - arriba)) : 0;

            if (siguiente !== desplazamientoRef.current) {
                desplazamientoRef.current = siguiente;
                setDesplazamiento(siguiente);
            }
        };

        medir();

        const observador = new ResizeObserver(() => requestAnimationFrame(medir));
        if (objetivoRef.current) observador.observe(objetivoRef.current);
        if (obstaculoRef.current) observador.observe(obstaculoRef.current);
        window.addEventListener('resize', medir);

        return () => {
            observador.disconnect();
            window.removeEventListener('resize', medir);
        };
    }, [objetivoRef, obstaculoRef, separacion, activo]);

    return desplazamiento;
};
