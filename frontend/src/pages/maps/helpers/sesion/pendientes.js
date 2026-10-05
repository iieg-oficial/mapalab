const referencias = new Set();
const oyentes = new Set();

export const registrarPendiente = (ref) => {
    if (!ref || referencias.has(ref)) return;
    referencias.add(ref);
    oyentes.forEach((fn) => fn());
};

export const leerPendientes = () => [...referencias];

export const suscribirPendientes = (fn) => {
    oyentes.add(fn);
    return () => oyentes.delete(fn);
};
