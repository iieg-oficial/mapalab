import { COLORES_COMPARADOR } from '@pages/maps/helpers/coloresComparador';

const color = (indice) => COLORES_COMPARADOR[indice % COLORES_COMPARADOR.length];

export const gruposDe = (filas) => filas.filter(f => !f.esBase && f.enPuntos);

export const seriePorMunicipio = (columnas, grupos, clave) => {
    const serie = Math.max(columnas.findIndex(c => c.clave === clave), 0);
    return {
        tono: color(serie),
        titulo: columnas[serie]?.nombre,
        pie: `Porcentaje sobre el total de ${columnas[serie]?.nombre}`,
        ejes: grupos.map(f => f.nombre),
        puntos: grupos.map((fila, i) => {
            const celda = fila.celdas[serie];
            const pct = celda?.porcentaje;
            return pct === null || pct === undefined
                ? null
                : { i, pct, bruto: celda.bruto, etiqueta: fila.nombre };
        }),
    };
};

export const seriePorIndicador = (columnas, grupos, nombre, orden = 0) => {
    const fila = grupos.find(f => f.nombre === nombre) || grupos[0];
    return {
        tono: color(orden),
        titulo: fila?.nombre,
        pie: `${fila?.nombre} como porcentaje del total de cada municipio`,
        ejes: columnas.map(c => c.nombre),
        puntos: columnas.map((columna, i) => {
            const celda = fila?.celdas[i];
            const pct = celda?.porcentaje;
            return pct === null || pct === undefined
                ? null
                : { i, pct, bruto: celda.bruto, etiqueta: columna.nombre };
        }),
    };
};


export const seriesDe = (columnas, grupos, eje, seleccion) => {
    const lista = Array.isArray(seleccion) ? seleccion : [seleccion].filter(v => v !== null);
    if (eje === 'propiedad') {
        return lista.map((nombre, i) => seriePorIndicador(columnas, grupos, nombre, i));
    }
    return lista.map(clave => seriePorMunicipio(columnas, grupos, clave));
};
