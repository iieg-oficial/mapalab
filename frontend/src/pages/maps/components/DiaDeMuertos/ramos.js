const VARIANTES_MARAVILLA = ['rbrbb', 'brbrr', 'rrbrb', 'bbrbr', 'rbbrb', 'brrbr'];

export const varianteAlAzar = () => VARIANTES_MARAVILLA[Math.floor(Math.random() * VARIANTES_MARAVILLA.length)];

export const RAMO_EXPANDIDO = {
    ancho: 340,
    alto: 116,
    top: -12,
    ramas: [
        { d: 'M2.6 66 C44.5 104 91.5 92 136 72 C177.8 54 196.2 30 238 46 C279.8 62 295.5 104 337.4 98', stroke: '#7FA65E', width: 1.2 },
        { d: 'M0 104 C34 64 81.1 18 125.5 40 C162.2 58 156.9 92 196.2 82 C235.4 72 243.2 28 279.8 34 C313.8 40 324.3 76 340 62', stroke: '#4F7A3A', width: 2.8, brillo: true },
    ],
    zarcillos: [
        'M83.7 26 c-2 -7 -10 -9 -12 -4 c-1 4 4 5 5 2',
        'M175.2 84 c2 7 10 9 12 4 c1 -4 -4 -5 -5 -2',
        'M256.3 36 c-1 -6 -8 -9 -11 -5 c-2 3 2 6 5 3',
        'M39.2 92 c-4 4 -10 2 -9 -2 c1 -3 5 -2 4 1',
    ],
    hojas: [
        { x: 39.2, y: 63.3, r: -50, w: 20 },
        { x: 91.5, y: 35.2, r: 20, w: 20 },
        { x: 143.8, y: 52.9, r: 60, w: 20 },
        { x: 183.1, y: 83.8, r: -20, w: 20 },
        { x: 243.2, y: 47.7, r: -55, w: 20 },
        { x: 298.2, y: 40.9, r: 25, w: 20 },
        { x: 332.2, y: 65.2, r: -40, w: 20 },
    ],
    tallos: [
        'M20.9 80.7 Q26.2 87.7 24.8 94.7',
        'M65.4 44.9 Q60.2 38.4 61.5 31.9',
        'M117.7 36.8 Q122.9 43.3 121.6 49.8',
        'M167.4 78.8 Q172.6 85.8 171.3 92.8',
        'M219.7 70.1 Q214.5 63.6 215.8 57.1',
        'M269.4 33.6 Q274.6 40.1 273.3 46.6',
        'M319.1 57.5 Q313.8 50.5 315.2 43.5',
    ],
    flores: [
        { id: 'a', cx: 24.8, cy: 95, size: 40, lenta: true, dx: -6 },
        { id: 'b', cx: 61.5, cy: 32, size: 30, lenta: false, dx: 6 },
        { id: 'c', cx: 121.6, cy: 50, size: 28, lenta: false, dx: -8 },
        { id: 'd', cx: 171.3, cy: 93, size: 34, lenta: false, dx: 4 },
        { id: 'e', cx: 215.8, cy: 57, size: 28, lenta: false, dx: 8 },
        { id: 'f', cx: 273.3, cy: 47, size: 30, lenta: false, dx: -6 },
        { id: 'g', cx: 315.2, cy: 44, size: 40, lenta: true, dx: 6 },
    ],
};

export const RAMO_CONTRAIDO = {
    ancho: 88,
    alto: 72,
    top: 12,
    ramas: [
        { d: 'M0 48C14 40 24 56 44 48C62 40 72 56 88 46', stroke: '#7FA65E', width: 1.1 },
        { d: 'M0 52C16 60 28 42 44 50C60 58 74 44 88 50', stroke: '#4F7A3A', width: 2.4, brillo: true },
    ],
    zarcillos: [
        'M30 47c-1 -5 -6 -6 -7 -3c0 2 2 3 3 1',
        'M60 54c1 5 6 6 7 3c0 -2 -2 -3 -3 -1',
    ],
    hojas: [
        { x: 8, y: 55, r: 25, w: 14 },
        { x: 48, y: 49, r: -25, w: 14 },
        { x: 70, y: 53, r: 20, w: 14 },
    ],
    tallos: [
        'M14 56L13 54',
        'M44 50L44 56',
        'M75 48L75 52',
    ],
    flores: [
        { id: 'a', cx: 13, cy: 47, size: 20, lenta: true, dx: 0 },
        { id: 'b', cx: 44, cy: 60, size: 18, lenta: false, dx: 0 },
        { id: 'c', cx: 75, cy: 45, size: 20, lenta: true, dx: 0 },
    ],
};
