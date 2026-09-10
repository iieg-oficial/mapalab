export const PANTALLA_REAL = 'real';

export const PANTALLAS = {
    movil: { etiqueta: 'Móvil', ancho: 390, alto: 844 },
    tablet: { etiqueta: 'Tablet', ancho: 768, alto: 1024 },
    laptop: { etiqueta: 'Laptop', ancho: 1280, alto: 800 },
    escritorio: { etiqueta: 'Escritorio', ancho: 1920, alto: 1080 },
};

export const OPCIONES_PANTALLA = [
    { value: PANTALLA_REAL, label: 'Real' },
    ...Object.entries(PANTALLAS).map(([value, { ancho }]) => ({ value, label: String(ancho) })),
];

export const describirPantalla = (clave) => {
    const pantalla = PANTALLAS[clave];
    if (!pantalla) return 'Tamaño real de la ventana';
    return `${pantalla.etiqueta} · ${pantalla.ancho} × ${pantalla.alto}`;
};

export const escalaParaCaber = (pantalla, espacio) =>
    Math.min(1, espacio.ancho / pantalla.ancho, espacio.alto / pantalla.alto);
