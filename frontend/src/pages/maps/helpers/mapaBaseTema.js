export const MAPA_OSCURO = 'oscuro';

let anterior = null;

export const recordarMapaAnterior = (id) => {
    anterior = id;
};

export const mapaAnterior = () => anterior;

export const mapaParaGuardar = (baseMapId) => {
    if (baseMapId !== MAPA_OSCURO) return baseMapId || null;
    return anterior;
};
