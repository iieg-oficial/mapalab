import { useLayoutEffect, useRef, useState } from 'react';

export const useBordeDerecho = (selector, { base = 0, activo = true } = {}) => {
    const [borde, setBorde] = useState(base);
    const baseRef = useRef(base);
    baseRef.current = base;

    useLayoutEffect(() => {
        if (!activo) {
            setBorde(baseRef.current);
            return undefined;
        }

        const medir = () => {
            let limite = baseRef.current;
            for (const nodo of document.querySelectorAll(selector)) {
                const caja = nodo.getBoundingClientRect();
                if (caja.width && caja.height) limite = Math.max(limite, caja.right);
            }
            setBorde(limite);
        };

        medir();

        const observador = new ResizeObserver(() => requestAnimationFrame(medir));
        for (const nodo of document.querySelectorAll(selector)) observador.observe(nodo);
        window.addEventListener('resize', medir, { passive: true });

        return () => {
            observador.disconnect();
            window.removeEventListener('resize', medir);
        };
    }, [selector, activo]);

    return borde;
};
