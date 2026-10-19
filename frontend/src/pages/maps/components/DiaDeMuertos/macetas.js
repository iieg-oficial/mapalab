const VARIANTES_MARAVILLA = ['rbrbb', 'brbrr', 'rrbrb', 'bbrbr', 'rbbrb', 'brrbr'];

export const varianteAlAzar = () => VARIANTES_MARAVILLA[Math.floor(Math.random() * VARIANTES_MARAVILLA.length)];

const ALTO = 92;
const FONDO = 88;
const HOJAS = [[-15, -4, -35, 14], [10, -6, 30, 14]];

const RAMOS = {
    uno: [[0, -18, 22]],
    dos: [[-6, -17, 22], [6, -12, 20]],
    tres: [[-12, -16, 22], [0, -25, 26], [12, -14, 20]],
    seis: [[-10, -36, 21], [15, -31, 21], [1, -46, 20], [-21, -17, 20], [-3, -20, 21], [24, -17, 20]],
};

const EXPANDIDO = {
    prefijo: 'x',
    ancho: 340,
    macetas: [
        { cx: 48, w: 56, h: 28, tipo: 'maravilla', escala: 1, ramo: RAMOS.seis },
        { cx: 240, w: 28, h: 14, tipo: 'cempasuchil', escala: 0.75, ramo: RAMOS.uno },
        { cx: 308, w: 30, h: 22, tipo: 'cempasuchil', escala: 0.9, ramo: RAMOS.dos },
        { cx: 274, w: 32, h: 32, tipo: 'cempasuchil', escala: 1, ramo: RAMOS.tres },
    ],
};

const CONTRAIDO = {
    prefijo: 'c',
    ancho: 88,
    macetas: [
        { cx: 21, w: 20, h: 12, tipo: 'maravilla', escala: 0.5, ramo: RAMOS.tres },
        { cx: 64, w: 24, h: 26, tipo: 'cempasuchil', escala: 0.65, ramo: RAMOS.tres },
    ],
};

const armar = ({ prefijo, ancho, macetas }) => ({
    ancho,
    alto: ALTO,
    macetas: macetas.map(({ cx, w, h }, i) => ({ id: `${prefijo}${i}`, left: cx - w / 2, top: FONDO - h, w, h })),
    flores: macetas.flatMap(({ cx, h, tipo, escala, ramo }, i) => ramo.map(([dx, dy, size], k) => ({
        id: `${prefijo}${i}-${k}`,
        tipo,
        cx: cx + dx * escala,
        cy: FONDO - h + dy * escala,
        size: size * escala,
        caida: k % 2 ? 6 : -6,
    }))),
    tallos: macetas.flatMap(({ cx, h, escala, ramo }) => {
        const boca = FONDO - h;
        return ramo.map(([dx, dy]) => {
            const x = dx * escala;
            const y = dy * escala;
            return `M${cx + x * 0.3} ${boca + 2} Q${cx + x * 0.6} ${boca + y / 2} ${cx + x} ${boca + y}`;
        });
    }),
    hojas: macetas.flatMap(({ cx, h, escala }) => HOJAS.map(([dx, dy, r, w]) => ({
        x: cx + dx * escala,
        y: FONDO - h + dy * escala,
        r,
        w: w * escala,
    }))),
});

export const ARREGLO_EXPANDIDO = armar(EXPANDIDO);
export const ARREGLO_CONTRAIDO = armar(CONTRAIDO);
