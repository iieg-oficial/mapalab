const FONDOS = {
    blanco: '#FFFFFF',
    'morado-suave': 'var(--color-purple-soft)',
    morado: 'var(--color-purple)',
    naranja: 'var(--color-orange)',
    grafito: 'var(--color-graphite)',
};

const TRAMOS = { ninguno: 0, solido: 1, mitades: 2, tercios: 3 };

const ANIMACION_POR_DEFECTO = 'pelota';

export const colorDeFondo = (id) => FONDOS[id] || FONDOS.blanco;

export const tramosDeForma = (forma) => TRAMOS[forma] ?? 0;

export const esEventoLite = (evento) => evento?.modo === 'lite';

export const TEMA_DIA_DE_MUERTOS = 'dia-de-muertos';

export const decoracionDeEventos = (eventos) => (eventos || []).find((e) => e?.decoracion && e.decoracion !== 'ninguna') || null;

export const esDiaDeMuertos = (decoracion) => Boolean(decoracion?.activa) && decoracion.tema === TEMA_DIA_DE_MUERTOS;

export const animacionDeDato = (fact, evento) => fact?.animacion || evento?.animacion || ANIMACION_POR_DEFECTO;
