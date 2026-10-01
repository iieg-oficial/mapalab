import { huellaCono } from '@pages/maps/helpers/dron/camaraDron';

export const TOPE_ESCRITORIO_S = 60;
export const TOPE_CELULAR_S = 30;
export const CUADROS_POR_SEGUNDO = 30;
export const TAMANO_VUELO = [1280, 720];
const ALTURA_DE_ESCALA_M = 300;

export const topeDeVuelo = celular => (celular ? TOPE_CELULAR_S : TOPE_ESCRITORIO_S);

export const reloj = (segundos) => {
    const total = Math.max(0, Math.floor(segundos));
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export const indicadoresDeVuelo = ({ kmh, maximoKmh, agl, rumbo, cono }) => {
    const velocidad = { tipo: 'dial', fraccion: kmh / Math.max(1, maximoKmh), valor: String(Math.round(kmh)), unidad: 'km/h', etiqueta: 'VELOCIDAD' };
    const altura = { tipo: 'dial', fraccion: agl / ALTURA_DE_ESCALA_M, valor: String(Math.round(agl)), unidad: 'm del suelo', etiqueta: 'ALTURA' };
    if (!cono) return [velocidad, altura, { tipo: 'brujula', rumbo, etiqueta: 'RUMBO' }];
    const { largo, ancho } = huellaCono(agl);
    return [velocidad, altura, { tipo: 'dial', fraccion: agl / ALTURA_DE_ESCALA_M, valor: `${largo}×${ancho}`, unidad: 'm de huella', etiqueta: 'CONO' }];
};
