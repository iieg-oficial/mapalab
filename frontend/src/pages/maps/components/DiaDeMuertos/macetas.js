const VARIANTES_MARAVILLA = ['rbrbb', 'brbrr', 'rrbrb', 'bbrbr', 'rbbrb', 'brrbr'];

export const varianteAlAzar = () => VARIANTES_MARAVILLA[Math.floor(Math.random() * VARIANTES_MARAVILLA.length)];

const HOJAS = [[-15, -4, -35, 14], [10, -6, 30, 14]];

const RAMO = [[-12, -16, 22], [0, -25, 26], [12, -14, 20]];

const OFRENDA = {
    prefijo: 'o',
    ancho: 122,
    alto: 52,
    fondo: 40,
    macetas: [
        { cx: 16, w: 13, h: 9, tipo: 'maravilla', escala: 0.42, ramo: RAMO },
        { cx: 48, w: 16, h: 12, tipo: 'cempasuchil', escala: 0.5, ramo: RAMO },
        { cx: 80, w: 13, h: 9, tipo: 'maravilla', escala: 0.42, ramo: RAMO },
    ],
};

const armar = ({ prefijo, ancho, alto, fondo, macetas }) => ({
    ancho,
    alto,
    macetas: macetas.map(({ cx, w, h }, i) => ({ id: `${prefijo}${i}`, left: cx - w / 2, top: fondo - h, w, h })),
    flores: macetas.flatMap(({ cx, h, tipo, escala, ramo }, i) => ramo.map(([dx, dy, size], k) => ({
        id: `${prefijo}${i}-${k}`,
        tipo,
        cx: cx + dx * escala,
        cy: fondo - h + dy * escala,
        size: size * escala,
        caida: k % 2 ? 6 : -6,
    }))),
    tallos: macetas.flatMap(({ cx, h, escala, ramo }) => {
        const boca = fondo - h;
        return ramo.map(([dx, dy]) => {
            const x = dx * escala;
            const y = dy * escala;
            return `M${cx + x * 0.3} ${boca + 2} Q${cx + x * 0.6} ${boca + y / 2} ${cx + x} ${boca + y}`;
        });
    }),
    hojas: macetas.flatMap(({ cx, h, escala }) => HOJAS.map(([dx, dy, r, w]) => ({
        x: cx + dx * escala,
        y: fondo - h + dy * escala,
        r,
        w: w * escala,
    }))),
});

export const ARREGLO_OFRENDA = armar(OFRENDA);
