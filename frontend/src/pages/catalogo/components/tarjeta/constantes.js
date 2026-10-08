export const esTituloFijo = (titulo, columnas) => typeof titulo === 'string'
    && (!Array.isArray(columnas) || !columnas.includes(titulo));

export const NOMBRE_BLOQUE = { cards: 'Cifras', list: 'Detalles', text: 'Texto' };
