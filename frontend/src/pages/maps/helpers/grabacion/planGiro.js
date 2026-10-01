export const TAMANOS = { 720: [1280, 720], 1080: [1920, 1080] };
const LADO_GIF = 480;
const MAXIMO_VIDEO_S = 30;
const VELOCIDAD_PREDETERMINADA = 8;

export const planDeGiro = ({ tipo, segundosGif = 3, calidad = '720', velocidad }) => {
    const gif = tipo === 'gif';
    const fps = gif ? 15 : 30;
    const grados = Math.max(1, Number(velocidad) || VELOCIDAD_PREDETERMINADA);
    const segundos = gif ? segundosGif : Math.min(MAXIMO_VIDEO_S, 360 / grados);
    const [ancho, alto] = gif ? [LADO_GIF, LADO_GIF] : TAMANOS[calidad] || TAMANOS[720];
    return { fps, segundos, cuadros: Math.round(segundos * fps), ancho, alto };
};

export const rumboDelCuadro = (inicio, indice, cuadros) => (((inicio + (360 * indice) / cuadros) % 360) + 360) % 360;

export const nombreDeArchivo = (titulo, fecha = new Date()) => {
    const limpio = (titulo || 'mapa')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 60) || 'mapa';
    const dia = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    return `mapalab_${limpio}_${dia}`;
};

export const indicadoresDeGiro = ({ rumbo, inclinacion, zoom }) => [
    { tipo: 'brujula', rumbo, etiqueta: 'RUMBO' },
    { tipo: 'dial', fraccion: inclinacion / 85, valor: `${Math.round(inclinacion)}°`, unidad: 'inclinación', etiqueta: 'CÁMARA' },
    { tipo: 'dial', fraccion: zoom / 20, valor: zoom.toFixed(1), unidad: 'zoom', etiqueta: 'ESCALA' },
];
