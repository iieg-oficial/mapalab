const VARIANTES_MARAVILLA = ['rbrbb', 'brbrr', 'rrbrb', 'bbrbr', 'rbbrb', 'brrbr'];

export const varianteAlAzar = () => VARIANTES_MARAVILLA[Math.floor(Math.random() * VARIANTES_MARAVILLA.length)];

const ALTO = 92;
const FONDO = 88;

const ESCALAS = {
    expandido: {
        prefijo: 'x',
        ancho: 340,
        centros: [34, 102, 170, 238, 306],
        maravilla: 4,
        maceta: { w: 40, h: 22 },
        flores: [[-12, -16, 22], [0, -25, 26], [12, -14, 20]],
        hojas: [[-15, -4, -35, 14], [10, -6, 30, 14]],
    },
    contraido: {
        prefijo: 'c',
        ancho: 88,
        centros: [16, 44, 72],
        maravilla: 2,
        maceta: { w: 24, h: 14 },
        flores: [[-6, -10, 13], [0, -16, 15], [6, -9, 12]],
        hojas: [[-9, -3, -35, 9], [6, -4, 30, 9]],
    },
};

const armar = ({ prefijo, ancho, centros, maravilla, maceta, flores, hojas }) => {
    const boca = FONDO - maceta.h;
    return {
        ancho,
        alto: ALTO,
        macetas: centros.map((cx, i) => ({ id: `${prefijo}${i}`, left: cx - maceta.w / 2, top: boca, w: maceta.w, h: maceta.h })),
        flores: centros.flatMap((cx, i) => flores.map(([dx, dy, size], k) => ({
            id: `${prefijo}${i}-${k}`,
            tipo: i === maravilla ? 'maravilla' : 'cempasuchil',
            cx: cx + dx,
            cy: boca + dy,
            size,
            caida: k % 2 ? 6 : -6,
        }))),
        tallos: centros.flatMap((cx) => flores.map(([dx, dy]) => `M${cx + dx * 0.3} ${boca + 2} Q${cx + dx * 0.6} ${boca + dy / 2} ${cx + dx} ${boca + dy}`)),
        hojas: centros.flatMap((cx) => hojas.map(([dx, dy, r, w]) => ({ x: cx + dx, y: boca + dy, r, w }))),
    };
};

export const ARREGLO_EXPANDIDO = armar(ESCALAS.expandido);
export const ARREGLO_CONTRAIDO = armar(ESCALAS.contraido);
