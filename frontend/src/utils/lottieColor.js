const aRgb = (hex) => {
    const limpio = hex.replace('#', '');
    const completo = limpio.length === 3 ? limpio.split('').map(c => c + c).join('') : limpio;
    const numero = parseInt(completo, 16);
    return [(numero >> 16) & 255, (numero >> 8) & 255, numero & 255].map(v => v / 255);
};

const esColor = (valor) => Array.isArray(valor) && valor.length >= 3 && valor.every(v => typeof v === 'number');

const pintar = (valor, rgb) => [...rgb, valor.length > 3 ? valor[3] : 1];

const recolorearPropiedad = (propiedad, rgb) => {
    if (esColor(propiedad.k)) return { ...propiedad, k: pintar(propiedad.k, rgb) };
    if (!Array.isArray(propiedad.k)) return propiedad;
    return {
        ...propiedad,
        k: propiedad.k.map(cuadro => ({
            ...cuadro,
            ...(esColor(cuadro.s) ? { s: pintar(cuadro.s, rgb) } : {}),
            ...(esColor(cuadro.e) ? { e: pintar(cuadro.e, rgb) } : {}),
        })),
    };
};

const recorrer = (nodo, rgb) => {
    if (Array.isArray(nodo)) return nodo.map(hijo => recorrer(hijo, rgb));
    if (!nodo || typeof nodo !== 'object') return nodo;
    const copia = Object.fromEntries(Object.entries(nodo).map(([llave, valor]) => [llave, recorrer(valor, rgb)]));
    if ((copia.ty === 'fl' || copia.ty === 'st') && copia.c) copia.c = recolorearPropiedad(copia.c, rgb);
    return copia;
};

export const recolorearLottie = (animacion, color) => (color ? recorrer(animacion, aRgb(color)) : animacion);
