import { useEffect } from 'react';

const MOVIMIENTO = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyR', 'KeyF',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight',
]);

const escribiendo = objetivo => !!objetivo?.closest?.('input, textarea, select, [contenteditable="true"]');

const eje = (teclas, mas, menos) => (teclas.has(mas) ? 1 : 0) - (teclas.has(menos) ? 1 : 0);

export const entradaManual = ({ teclas, joy }) => ({
    avance: eje(teclas, 'KeyW', 'KeyS') + joy.mz,
    lateral: eje(teclas, 'KeyD', 'KeyA') + joy.mx,
    giro: eje(teclas, 'KeyQ', 'KeyE') + eje(teclas, 'ArrowLeft', 'ArrowRight') + joy.giro,
    sube: eje(teclas, 'KeyR', 'KeyF') + (teclas.has('Space') ? 1 : 0) - (teclas.has('ShiftLeft') || teclas.has('ShiftRight') ? 1 : 0) + joy.sube,
    mira: eje(teclas, 'ArrowUp', 'ArrowDown'),
});

export const hayEntradaManual = ({ teclas, joy }) => teclas.size > 0 || Object.values(joy).some(v => v !== 0);

export const useDronTeclado = (activo, dron) => {
    const { controlesRef, setOpcion, alternar, setAuto, salir, accionesRef, destinoRef } = dron;

    useEffect(() => {
        if (!activo) return undefined;
        const teclas = controlesRef.current.teclas;
        const alBajar = (e) => {
            if (escribiendo(e.target)) return;
            if (MOVIMIENTO.has(e.code)) {
                if (e.target?.closest?.('button') && (e.code === 'Space')) return;
                teclas.add(e.code);
                destinoRef.current = null;
                setAuto(false);
                e.preventDefault();
                return;
            }
            const acciones = {
                Digit1: () => setOpcion('velocidad', 0),
                Digit2: () => setOpcion('velocidad', 1),
                Digit3: () => setOpcion('velocidad', 2),
                KeyV: () => alternar('tercera'),
                KeyP: () => setAuto(previo => !previo),
                KeyH: () => accionesRef.current.nivelar?.(),
                Escape: salir,
            };
            acciones[e.code]?.();
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
    }, [activo, controlesRef, setOpcion, alternar, setAuto, salir, accionesRef, destinoRef]);
};
