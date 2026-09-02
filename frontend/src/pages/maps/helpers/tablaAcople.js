export const ACOPLES = ['flotante', 'izquierda', 'derecha', 'arriba', 'abajo'];

export const MARGEN_SNAP = 48;
const ANCHO_ACOPLADO = 0.42;
const ALTO_ACOPLADO = 0.4;

export const zonaDeSnap = ({ x, y, ancho, alto, margen = MARGEN_SNAP }) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (y >= alto - margen) return 'abajo';
    if (y <= margen) return 'arriba';
    if (x <= margen) return 'izquierda';
    if (x >= ancho - margen) return 'derecha';
    return null;
};

export const medidasDeAcople = (acople, { ancho, alto }) => {
    if (acople === 'izquierda' || acople === 'derecha') {
        return { ancho: Math.round(ancho * ANCHO_ACOPLADO), alto };
    }
    if (acople === 'abajo' || acople === 'arriba') {
        return { ancho, alto: Math.round(alto * ALTO_ACOPLADO) };
    }
    return null;
};

export const estiloDelPanel = (acople, ventana) => {
    const medidas = medidasDeAcople(acople, ventana);
    if (!medidas) return null;

    if (acople === 'izquierda') return { left: 0, top: 0, bottom: 0, width: medidas.ancho };
    if (acople === 'derecha') return { right: 0, top: 0, bottom: 0, width: medidas.ancho };
    if (acople === 'arriba') return { left: 0, right: 0, top: 0, height: medidas.alto };
    return { left: 0, right: 0, bottom: 0, height: medidas.alto };
};

export const margenesDelMapa = (acople, ventana) => {
    const vacio = { left: 0, right: 0, top: 0, bottom: 0 };
    const medidas = medidasDeAcople(acople, ventana);
    if (!medidas) return vacio;

    if (acople === 'izquierda') return { ...vacio, left: medidas.ancho };
    if (acople === 'derecha') return { ...vacio, right: medidas.ancho };
    if (acople === 'arriba') return { ...vacio, top: medidas.alto };
    return { ...vacio, bottom: medidas.alto };
};
