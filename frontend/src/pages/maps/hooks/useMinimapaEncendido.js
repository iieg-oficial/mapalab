import { useCallback, useSyncExternalStore } from 'react';

const LLAVE = 'mapalab.minimapa';
const oyentes = new Set();

const leer = () => {
    try {
        return localStorage.getItem(LLAVE) === 'encendido';
    } catch {
        return false;
    }
};

let encendido = leer();

const guardar = (valor) => {
    try {
        if (valor) localStorage.setItem(LLAVE, 'encendido');
        else localStorage.removeItem(LLAVE);
        return true;
    } catch {
        return false;
    }
};

export const fijarMinimapaEncendido = (valor) => {
    encendido = !!valor;
    guardar(encendido);
    oyentes.forEach(oyente => oyente());
};

const suscribir = (oyente) => {
    oyentes.add(oyente);
    return () => oyentes.delete(oyente);
};

export const useMinimapaEncendido = () => {
    const valor = useSyncExternalStore(suscribir, () => encendido);
    const alternar = useCallback(() => fijarMinimapaEncendido(!encendido), []);
    return [valor, alternar];
};
