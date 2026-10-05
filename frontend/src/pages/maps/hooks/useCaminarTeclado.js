import { useEffect } from 'react';

const MOVIMIENTO = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight',
]);

const escribiendo = objetivo => !!objetivo?.closest?.('input, textarea, select, [contenteditable="true"]');

const eje = (teclas, mas, menos) => (teclas.has(mas) ? 1 : 0) - (teclas.has(menos) ? 1 : 0);

export const entradaCaminar = teclas => ({
    avance: eje(teclas, 'KeyW', 'KeyS') + eje(teclas, 'ArrowUp', 'ArrowDown'),
    lateral: eje(teclas, 'KeyD', 'KeyA'),
    giro: eje(teclas, 'KeyE', 'KeyQ') + eje(teclas, 'ArrowRight', 'ArrowLeft'),
    correr: teclas.has('ShiftLeft') || teclas.has('ShiftRight'),
});

export const useCaminarTeclado = (activo, { teclasRef, alternarVista, salir }) => {
    useEffect(() => {
        if (!activo) return undefined;
        const teclas = teclasRef.current;
        const alBajar = (e) => {
            if (escribiendo(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
            if (MOVIMIENTO.has(e.code)) {
                teclas.add(e.code);
                e.preventDefault();
                return;
            }
            if (e.code === 'KeyV') alternarVista();
            if (e.code === 'Escape' && !document.querySelector('[role="dialog"]')) salir();
        };
        const alSubir = e => teclas.delete(e.code);
        const alPerder = () => teclas.clear();
        window.addEventListener('keydown', alBajar);
        window.addEventListener('keyup', alSubir);
        window.addEventListener('blur', alPerder);
        return () => {
            window.removeEventListener('keydown', alBajar);
            window.removeEventListener('keyup', alSubir);
            window.removeEventListener('blur', alPerder);
            teclas.clear();
        };
    }, [activo, teclasRef, alternarVista, salir]);
};
