export const ACOPLES = ['flotante', 'abajo'];

export const MARGEN_SNAP = 48;
const ALTO_ACOPLADO = 0.4;
export const ALTO_MINIMO = 180;
const PROPORCION_MAXIMA = 0.8;

export const limitarAlto = (alto, altoVentana) => {
    const maximo = Math.max(Math.round(altoVentana * PROPORCION_MAXIMA), ALTO_MINIMO);
    return Math.min(Math.max(Math.round(alto), ALTO_MINIMO), maximo);
};

export const zonaDeSnap = ({ y, alto, margen = MARGEN_SNAP }) => {
    if (!Number.isFinite(y)) return null;
    return y >= alto - margen ? 'abajo' : null;
};

export const medidasDeAcople = (acople, { ancho, alto }, altoElegido = null) => {
    if (acople !== 'abajo') return null;
    const propuesto = Number.isFinite(altoElegido) ? altoElegido : alto * ALTO_ACOPLADO;
    return { ancho, alto: limitarAlto(propuesto, alto) };
};

export const estiloDelPanel = (acople, ventana, altoElegido = null) => {
    const medidas = medidasDeAcople(acople, ventana, altoElegido);
    if (!medidas) return null;

    return { left: 0, right: 0, bottom: 0, height: medidas.alto };
};

export const margenesDelMapa = (acople, ventana, altoElegido = null) => {
    const vacio = { left: 0, right: 0, top: 0, bottom: 0 };
    const medidas = medidasDeAcople(acople, ventana, altoElegido);
    if (!medidas) return vacio;

    return { ...vacio, bottom: medidas.alto };
};
