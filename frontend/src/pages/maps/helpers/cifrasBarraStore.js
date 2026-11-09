let estado = { activas: false, solicitud: null, cargando: false };
const oyentes = new Set();

export const cifrasBarraStore = {
    subscribe(oyente) {
        oyentes.add(oyente);
        return () => oyentes.delete(oyente);
    },
    get() {
        return estado;
    },
    fijar(parcial) {
        estado = { ...estado, ...parcial };
        oyentes.forEach(oyente => oyente());
    },
};

let posicion = null;
const oyentesPosicion = new Set();

export const posicionBarraStore = {
    subscribe(oyente) {
        oyentesPosicion.add(oyente);
        return () => oyentesPosicion.delete(oyente);
    },
    get() {
        return posicion;
    },
    fijar(valor) {
        if (valor === posicion) return;
        posicion = valor;
        oyentesPosicion.forEach(oyente => oyente());
    },
};
