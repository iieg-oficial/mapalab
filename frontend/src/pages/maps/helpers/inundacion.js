export const NIVEL_MAXIMO = 300;
const CURVA = 2.5;

export const INTENSIDADES = {
    ligera: { nombre: 'Ligera', detalle: 'Unos 10 mm por hora: solo se llenan los cauces', subida: 0.15, tope: 1.5, gotas: 0.35 },
    moderada: { nombre: 'Moderada', detalle: 'Unos 30 mm por hora: charcos y encharcamientos en lo más bajo', subida: 0.4, tope: 5, gotas: 0.6 },
    fuerte: { nombre: 'Fuerte', detalle: 'Unos 60 mm por hora: se desbordan ríos y arroyos', subida: 1, tope: 20, gotas: 0.85 },
    torrencial: { nombre: 'Torrencial', detalle: 'Más de 100 mm por hora: inundación extendida', subida: 3, tope: 80, gotas: 1 },
};

export const INTENSIDAD_DEFAULT = 'moderada';

export const nivelDeDeslizador = valor => Number((NIVEL_MAXIMO * (valor / 100) ** CURVA).toFixed(1));

export const deslizadorDeNivel = nivel => Math.round(100 * (Math.max(0, nivel) / NIVEL_MAXIMO) ** (1 / CURVA));

export const textoNivel = nivel => (nivel < 10 ? nivel.toFixed(1) : String(Math.round(nivel)));

export const elevacionMinima = (alturas) => {
    const validas = alturas.filter(h => Number.isFinite(h));
    return validas.length ? Math.min(...validas) : null;
};
