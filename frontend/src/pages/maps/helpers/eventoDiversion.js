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

export const animacionDeDato = (fact, evento) => fact?.animacion || evento?.animacion || ANIMACION_POR_DEFECTO;
