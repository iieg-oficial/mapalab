import { useSyncExternalStore } from 'react';

const REPOSO = { fase: null, progreso: 0, error: null };
const oyentes = new Set();
let estado = REPOSO;
let cancelado = false;

const avisar = () => oyentes.forEach(oyente => oyente());

export const fijarEstadoGiro = (cambio) => {
    estado = cambio === null ? { ...REPOSO, error: estado.error } : { ...estado, ...cambio };
    avisar();
};

export const iniciarGiro = () => {
    cancelado = false;
    estado = { ...REPOSO, fase: 'preparando' };
    avisar();
};

export const cancelarGiro = () => {
    cancelado = true;
    avisar();
};

export const giroCancelado = () => cancelado;

const suscribir = (oyente) => {
    oyentes.add(oyente);
    return () => oyentes.delete(oyente);
};

export const useEstadoGiro = () => useSyncExternalStore(suscribir, () => estado);
