import { VIEW3D_DEFAULTS, clampColumnas, clampSol } from './view3d';
import { ESTILOS_PUNTOS_3D, ESTILO_PUNTOS_3D_DEFAULT } from './estilosDePuntos3d';

export const ESTILOS_TEXTOS_3D = ['frente', 'planos'];
export const ESCALA_SIMBOLOS_3D = [0.75, 1.5];
export const VELOCIDAD_ORBITA_3D = [2, 20];
export const LLAVE_AJUSTES_3D = 'mapalab.vista3d.ajustes';

export const AJUSTES_3D_DEFAULT = {
    sol: VIEW3D_DEFAULTS.sol,
    alturaColumnas: VIEW3D_DEFAULTS.alturaColumnas,
    terreno: VIEW3D_DEFAULTS.terreno,
    cielo: VIEW3D_DEFAULTS.cielo,
    niebla: VIEW3D_DEFAULTS.niebla,
    contorno: true,
    agruparPuntos: false,
    estiloPuntos: ESTILO_PUNTOS_3D_DEFAULT,
    estiloTextos: 'frente',
    escalaSimbolos: 1,
    velocidadOrbita: 8,
};

const numero = (valor) => (valor === null || valor === '' || typeof valor === 'boolean' ? NaN : Number(valor));
const acotado = ([min, max], paso) => (valor, porDefecto) => {
    const n = numero(valor);
    if (!Number.isFinite(n)) return porDefecto;
    return Number((Math.round(Math.min(max, Math.max(min, n)) / paso) * paso).toFixed(2));
};
const logico = (valor, porDefecto) => (typeof valor === 'boolean' ? valor : porDefecto);
const opcion = (lista) => (valor, porDefecto) => (lista.includes(valor) ? valor : porDefecto);

const NORMALIZAR = {
    sol: (valor, porDefecto) => (Number.isFinite(numero(valor)) ? clampSol(valor) : porDefecto),
    alturaColumnas: (valor, porDefecto) => (Number.isFinite(numero(valor)) ? clampColumnas(valor) : porDefecto),
    terreno: logico,
    cielo: logico,
    niebla: logico,
    contorno: logico,
    agruparPuntos: logico,
    estiloPuntos: opcion(ESTILOS_PUNTOS_3D),
    estiloTextos: opcion(ESTILOS_TEXTOS_3D),
    escalaSimbolos: acotado(ESCALA_SIMBOLOS_3D, 0.05),
    velocidadOrbita: acotado(VELOCIDAD_ORBITA_3D, 1),
};

export const normalizarAjustes3d = (crudo) => {
    const fuente = crudo && typeof crudo === 'object' ? crudo : {};
    return Object.fromEntries(Object.entries(AJUSTES_3D_DEFAULT).map(([clave, porDefecto]) => (
        [clave, clave in fuente ? NORMALIZAR[clave](fuente[clave], porDefecto) : porDefecto]
    )));
};

export const ajustesDistintos = (ajustes) => Object.fromEntries(
    Object.entries(normalizarAjustes3d(ajustes)).filter(([clave, valor]) => valor !== AJUSTES_3D_DEFAULT[clave]),
);

export const leerAjustesGuardados = (llave = LLAVE_AJUSTES_3D) => {
    try {
        return normalizarAjustes3d(JSON.parse(localStorage.getItem(llave) || '{}'));
    } catch {
        return { ...AJUSTES_3D_DEFAULT };
    }
};

export const guardarAjustes3d = (ajustes, llave = LLAVE_AJUSTES_3D) => {
    try {
        localStorage.setItem(llave, JSON.stringify(ajustesDistintos(ajustes)));
    } catch {
        return;
    }
};
