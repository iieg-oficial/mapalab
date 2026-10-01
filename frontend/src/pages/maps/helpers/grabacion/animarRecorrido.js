import { fromLonLat, transformExtent } from 'ol/proj';
import { aMinimapa, largoDeRuta, teselasVisibles, urlTesela } from '@pages/maps/helpers/dron/minimapaDron';
import { cargarTesela, encuadrarRecorrido } from '@pages/maps/helpers/dron/exportarRecorrido';
import { flecha } from '@pages/maps/helpers/dron/dibujoMinimapa';
import { crearCodificador } from './codificador';
import { cargarRecursos, componerCuadro } from './composicion';

const NARANJA = '#FF8300';
const GRIS = 'rgba(70, 80, 85, 0.45)';
const FONDO = '#EEF1F4';
const ZOOM_UBICACION = 11;
const TAMANOS = { gif: [480, 480], video: [1280, 720] };
const FPS = { gif: 15, video: 30 };
const formato = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });

export const caminoDelRecorrido = ({ dron, ruta, rastro }) => {
    if (ruta.puntos.length) {
        const vuelta = ruta.ciclo && ruta.puntos.length > 1 ? [ruta.puntos[0]] : [];
        return { puntos: [dron.lngLat, ...ruta.puntos, ...vuelta], marcas: ruta.puntos.length };
    }
    return { puntos: rastro.length > 1 ? [...rastro, dron.lngLat] : [], marcas: 0 };
};

export const acumulados = (pixeles) => {
    const largos = [0];
    for (let i = 1; i < pixeles.length; i += 1) {
        const [ax, ay] = pixeles[i - 1];
        const [bx, by] = pixeles[i];
        largos.push(largos[i - 1] + Math.hypot(bx - ax, by - ay));
    }
    return largos;
};

export const puntoEn = (puntos, largos, fraccion) => {
    const total = largos[largos.length - 1] || 0;
    const meta = Math.max(0, Math.min(1, fraccion)) * total;
    let i = 1;
    while (i < largos.length - 1 && largos[i] < meta) i += 1;
    const tramo = largos[i] - largos[i - 1] || 1;
    const f = Math.max(0, Math.min(1, (meta - largos[i - 1]) / tramo));
    const [a, b] = [puntos[i - 1], puntos[Math.min(i, puntos.length - 1)]];
    return { punto: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], indice: i, f, desde: a, hacia: b };
};

const rumboEntre = ([ax, ay], [bx, by]) => (Math.atan2(bx - ax, ay - by) * 180) / Math.PI;

const trazar = (ctx, pixeles, color, grosor, guiones = []) => {
    if (pixeles.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash(guiones);
    ctx.beginPath();
    pixeles.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.restore();
};

const fondoDelRecorrido = async ({ plantilla, centro, zoom, ancho, alto }) => {
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext('2d');
    ctx.fillStyle = FONDO;
    ctx.fillRect(0, 0, ancho, alto);
    if (!plantilla) return lienzo;
    const teselas = teselasVisibles(centro, ancho, alto, zoom);
    const imagenes = await Promise.all(teselas.map(({ tx, ty }) => cargarTesela(urlTesela(plantilla, zoom, tx, ty))));
    teselas.forEach(({ x, y }, i) => { if (imagenes[i]) ctx.drawImage(imagenes[i], x, y, 256, 256); });
    return lienzo;
};

const dibujarAvance = (ctx, { fondo, pixeles, largos, marcas, fraccion, escala }) => {
    ctx.drawImage(fondo, 0, 0);
    trazar(ctx, pixeles, GRIS, 2.5 * escala, [6 * escala, 5 * escala]);
    const { punto, indice } = puntoEn(pixeles, largos, fraccion);
    trazar(ctx, [...pixeles.slice(0, indice), punto], NARANJA, 4 * escala);
    for (let m = 1; m <= marcas; m += 1) {
        const [x, y] = pixeles[m];
        const alcanzado = largos[m] <= fraccion * largos[largos.length - 1] + 0.5;
        ctx.save();
        ctx.fillStyle = alcanzado ? NARANJA : '#FFFFFF';
        ctx.strokeStyle = alcanzado ? '#FFFFFF' : NARANJA;
        ctx.lineWidth = 2 * escala;
        ctx.beginPath();
        ctx.arc(x, y, 8 * escala, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = alcanzado ? '#FFFFFF' : NARANJA;
        ctx.font = `800 ${9 * escala}px Garet, Figtree, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(m), x, y + 0.5);
        ctx.restore();
    }
    const { desde, hacia } = puntoEn(pixeles, largos, fraccion);
    ctx.save();
    ctx.translate(punto[0], punto[1]);
    ctx.scale(escala, escala);
    flecha(ctx, 0, 0, rumboEntre(desde, hacia));
    ctx.restore();
};

const indicadoresDeRecorrido = ({ fraccion, km, minutos }) => [
    { tipo: 'dial', fraccion, valor: `${Math.round(fraccion * 100)}%`, unidad: 'recorrido', etiqueta: 'RUTA' },
    { tipo: 'dial', fraccion, valor: formato.format(km * fraccion), unidad: `de ${formato.format(km)} km`, etiqueta: 'DISTANCIA' },
    { tipo: 'dial', fraccion, valor: formato.format(minutos * fraccion), unidad: 'min', etiqueta: 'TIEMPO' },
];

export const grabarRecorrido = async ({ tipo, segundos, plantilla, datos, kmh, alAvanzar }) => {
    const camino = caminoDelRecorrido(datos);
    if (camino.puntos.length < 2) throw new Error('Traza una ruta en el minimapa o vuela un poco antes de grabar.');
    const clave = tipo === 'gif' ? 'gif' : 'video';
    const [ancho, alto] = TAMANOS[clave];
    const fps = FPS[clave];
    const { zoom, centro } = encuadrarRecorrido(camino.puntos, ancho, alto);
    const pixeles = camino.puntos.map(p => aMinimapa(centro, p, ancho, alto, zoom));
    const largos = acumulados(pixeles);
    const salida = document.createElement('canvas');
    salida.width = ancho;
    salida.height = alto;
    const ctx = salida.getContext('2d', { willReadFrequently: tipo === 'gif' });
    const cuadro = document.createElement('canvas');
    cuadro.width = ancho;
    cuadro.height = alto;
    const ctxCuadro = cuadro.getContext('2d');
    const [fondo, recursos, codificador] = await Promise.all([
        fondoDelRecorrido({ plantilla, centro, zoom, ancho, alto }),
        cargarRecursos(),
        crearCodificador(tipo, salida, fps),
    ]);
    if (!codificador) throw new Error('Tu navegador no puede grabar video. Prueba con GIF.');
    const lngs = camino.puntos.map(p => p[0]);
    const lats = camino.puntos.map(p => p[1]);
    const extension = transformExtent([Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)], 'EPSG:4326', 'EPSG:3857');
    const km = largoDeRuta(camino.puntos[0], camino.puntos.slice(1)) / 1000;
    const minutos = kmh > 0 ? (km / kmh) * 60 : 0;
    const escala = Math.max(1, Math.min(ancho, alto) / 360);
    const total = Math.round(segundos * fps);
    for (let i = 0; i < total; i += 1) {
        const fraccion = total > 1 ? i / (total - 1) : 1;
        dibujarAvance(ctxCuadro, { fondo, pixeles, largos, marcas: camino.marcas, fraccion, escala });
        const cabeza = puntoEn(pixeles, largos, fraccion);
        const [a, b] = [camino.puntos[cabeza.indice - 1], camino.puntos[Math.min(cabeza.indice, camino.puntos.length - 1)]];
        const coord = fromLonLat([a[0] + (b[0] - a[0]) * cabeza.f, a[1] + (b[1] - a[1]) * cabeza.f]);
        componerCuadro(ctx, {
            ancho,
            alto,
            mapa: cuadro,
            recursos,
            rumbo: 0,
            ubicacion: { centro: coord, zoom: ZOOM_UBICACION, extension, marcador: { coord, rumbo: rumboEntre(cabeza.desde, cabeza.hacia) } },
            titulo: 'Recorrido en dron',
            totalCapas: 1,
            compacto: tipo === 'gif',
            indicadores: indicadoresDeRecorrido({ fraccion, km, minutos }),
        });
        await codificador.agregar(i / fps);
        alAvanzar?.((i + 1) / total);
    }
    return { archivo: await codificador.terminar(), extension: codificador.extension };
};
