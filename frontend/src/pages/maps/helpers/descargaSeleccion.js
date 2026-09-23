const escuchas = new Set();

export const alPedirDescargaDeSeleccion = (escucha) => {
    escuchas.add(escucha);
    return () => escuchas.delete(escucha);
};

export const pedirDescargaDeSeleccion = () => {
    escuchas.forEach(escucha => escucha());
};
