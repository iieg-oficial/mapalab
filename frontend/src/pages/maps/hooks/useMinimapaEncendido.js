import { useCallback, useSyncExternalStore } from 'react';

const LLAVE = 'mapalab.minimapa';
const oyentes = new Set();

const leer = () => {
    try {
        return localStorage.getItem(LLAVE) !== 'apagado';
    } catch {
        return true;
    }
};

let encendido = leer();

const guardar = (valor) => {
    try {
        if (valor) localStorage.removeItem(LLAVE);
        else localStorage.setItem(LLAVE, 'apagado');
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
