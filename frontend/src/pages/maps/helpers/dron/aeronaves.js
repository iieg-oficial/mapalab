export const AERONAVES = {
    cuadri: { nombre: 'Cuadricóptero', tipo: 'multi', vel: [40, 80, 120], giro: 1, acel: 2, subida: 12, instr: 'camara' },
    hexa: { nombre: 'Hexacóptero', tipo: 'multi', vel: [30, 60, 90], giro: 0.8, acel: 1.6, subida: 10, instr: 'camara' },
    ala: { nombre: 'Ala fija de mapeo', tipo: 'ala', vel: [90, 200, 350], giro: 0.55, acel: 1.1, subida: 14, instr: 'horizonte', perdida: 70 },
    vtol: { nombre: 'VTOL', tipo: 'ala', vel: [80, 220, 400], giro: 0.6, acel: 1.3, subida: 14, instr: 'horizonte' },
    fpv: { nombre: 'FPV de carreras', tipo: 'multi', vel: [80, 160, 240], giro: 1.9, acel: 3.5, subida: 28, instr: 'camara' },
    heli: { nombre: 'Helicóptero', tipo: 'multi', vel: [100, 220, 320], giro: 0.9, acel: 1.3, subida: 16, instr: 'horizonte' },
    jet: { nombre: 'Jet', tipo: 'ala', vel: [400, 900, 1600], giro: 0.5, acel: 0.9, subida: 90, instr: 'horizonte', perdida: 220, techo: 9000, distancia: 95 },
    globo: { nombre: 'Globo', tipo: 'globo', vel: [5, 12, 25], giro: 0.15, acel: 0.35, subida: 4, instr: 'vario', viento: [2.2, 1.1], distancia: 110 },
};

const MANDOS = {
    multi: { lateral: 'desplaza', reversa: true, avance: true },
    vtol: { lateral: 'desplaza', reversa: false, avance: true },
    ala: { lateral: 'gira', reversa: false, avance: true },
    globo: { lateral: null, reversa: false, avance: false },
};

export const mandosDe = (modelo) => {
    if (modelo === 'vtol') return MANDOS.vtol;
    return MANDOS[AERONAVES[modelo]?.tipo] || MANDOS.multi;
};

export const MODELOS_DRON = Object.keys(AERONAVES);

export const COLORES_DRON = [
    ['#6d2a8a', 'Morado'],
    ['#ff8300', 'Naranja'],
    ['#e9e5ee', 'Blanco'],
    ['#2b2735', 'Grafito'],
    ['#2f7d3b', 'Verde'],
    ['#1f6fa8', 'Azul'],
];

export const siguienteColor = (actual) => {
    const indice = COLORES_DRON.findIndex(([hex]) => hex === actual);
    return COLORES_DRON[(indice + 1) % COLORES_DRON.length];
};

export const DRON_DEFAULT = {
    modelo: 'cuadri',
    color: '#6d2a8a',
    velocidad: 1,
    seguir: true,
    tercera: true,
    estela: true,
    luces: true,
    foco: false,
};

export const normalizarDron = (valor) => {
    const base = { ...DRON_DEFAULT };
    if (!valor || typeof valor !== 'object') return base;
    if (AERONAVES[valor.modelo]) base.modelo = valor.modelo;
    if (COLORES_DRON.some(([hex]) => hex === valor.color)) base.color = valor.color;
    if ([0, 1, 2].includes(valor.velocidad)) base.velocidad = valor.velocidad;
    ['seguir', 'tercera', 'estela', 'luces', 'foco'].forEach((clave) => {
        if (typeof valor[clave] === 'boolean') base[clave] = valor[clave];
    });
    return base;
};
