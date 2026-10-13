import { normalizarOpciones, opcionesDeValor, valorDeOpciones } from '@pages/maps/helpers/hexbinOpciones';

export const PARAM_VISTA = 'agrupar';
export const VISTA_PUNTOS = 'puntos';
export const VISTA_HEXAGONOS = 'hex';

export const vistaDeParam = (valor) => (valor === VISTA_HEXAGONOS ? VISTA_HEXAGONOS : VISTA_PUNTOS);

export const PARAM_VALOR = 'valor';
export const PARAM_CLASES = 'clases';

export const opcionesDeParams = (valor, clases) => opcionesDeValor(valor, clases);

export const escribirOpciones = (params, opciones) => {
    const limpias = normalizarOpciones(opciones);
    const valor = valorDeOpciones(limpias);
    if (valor === 'count') params.delete(PARAM_VALOR);
    else params.set(PARAM_VALOR, valor);
    if (limpias.metodo === 'quantile') params.delete(PARAM_CLASES);
    else params.set(PARAM_CLASES, limpias.metodo);
    return params;
};
