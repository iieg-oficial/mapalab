export const TOPE_ESCRITORIO_S = 60;
export const TOPE_CELULAR_S = 30;
export const CUADROS_POR_SEGUNDO = 30;
export const TAMANO_VUELO = [1280, 720];

export const topeDeVuelo = celular => (celular ? TOPE_CELULAR_S : TOPE_ESCRITORIO_S);

export const reloj = (segundos) => {
    const total = Math.max(0, Math.floor(segundos));
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export const ACELERACION_MAXIMA = 20;
const HOLGURA = 1.5;
const MARGEN_S = 15;

export const planDeRuta = ({ estimadoS, tope }) => {
    if (!estimadoS || estimadoS <= 0) return { aceleracion: 1, ritmo: 1, limite: tope, mostrado: tope };
    const aceleracion = Math.max(1, Math.min(ACELERACION_MAXIMA, Math.ceil(estimadoS / tope)));
    const duracionReal = estimadoS / aceleracion;
    return {
        aceleracion,
        ritmo: Math.max(1, duracionReal / tope),
        limite: duracionReal * HOLGURA + MARGEN_S,
        mostrado: Math.ceil(duracionReal),
    };
};
