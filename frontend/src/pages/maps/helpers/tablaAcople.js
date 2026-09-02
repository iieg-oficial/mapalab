export const ACOPLES = ['flotante', 'abajo'];

export const MARGEN_SNAP = 48;
const ALTO_ACOPLADO = 0.4;

export const zonaDeSnap = ({ y, alto, margen = MARGEN_SNAP }) => {
    if (!Number.isFinite(y)) return null;
    return y >= alto - margen ? 'abajo' : null;
};

export const medidasDeAcople = (acople, { ancho, alto }) => {
    if (acople !== 'abajo') return null;
    return { ancho, alto: Math.round(alto * ALTO_ACOPLADO) };
};

export const estiloDelPanel = (acople, ventana) => {
    const medidas = medidasDeAcople(acople, ventana);
    if (!medidas) return null;

    return { left: 0, right: 0, bottom: 0, height: medidas.alto };
};

export const margenesDelMapa = (acople, ventana) => {
    const vacio = { left: 0, right: 0, top: 0, bottom: 0 };
    const medidas = medidasDeAcople(acople, ventana);
    if (!medidas) return vacio;

    return { ...vacio, bottom: medidas.alto };
};
