export const PARAM_VISTA = 'agrupar';
export const VISTA_PUNTOS = 'puntos';
export const VISTA_HEXAGONOS = 'hex';

export const vistaDeParam = (valor) => (valor === VISTA_HEXAGONOS ? VISTA_HEXAGONOS : VISTA_PUNTOS);
