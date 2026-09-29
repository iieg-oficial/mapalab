import { aLngLat, aMinimapa, aMundo, largoDeRuta, teselasVisibles, urlTesela } from './minimapaDron';
import { dibujarRecorrido, flecha } from './dibujoMinimapa';

const ANCHO = 1600;
const ALTO = 1100;
const CABECERA = 128;
const MARGEN = 120;
const ESPERA_TESELA_MS = 8000;
const FUENTE = 'Garet, Figtree, system-ui, sans-serif';
const formato = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });

export const encuadrarRecorrido = (puntos, ancho = ANCHO, alto = ALTO - CABECERA) => {
    for (let zoom = 16; zoom >= 3; zoom -= 1) {
        const xy = puntos.map(p => aMundo(p, zoom));
        const [xs, ys] = [xy.map(([x]) => x), xy.map(([, y]) => y)];
        const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        if (x1 - x0 <= ancho - 2 * MARGEN && y1 - y0 <= alto - 2 * MARGEN) {
            return { zoom, centro: aLngLat([(x0 + x1) / 2, (y0 + y1) / 2], zoom) };
        }
    }
    return { zoom: 3, centro: puntos[0] };
};

const cargar = url => new Promise((resolver) => {
    const img = new Image();
    const espera = setTimeout(() => resolver(null), ESPERA_TESELA_MS);
    img.crossOrigin = 'anonymous';
    img.onload = () => { clearTimeout(espera); resolver(img); };
    img.onerror = () => { clearTimeout(espera); resolver(null); };
    img.src = url;
});

const texto = (ctx, contenido, x, y, tam, peso, color, alinear = 'left') => {
    ctx.font = `${peso} ${tam}px ${FUENTE}`;
    ctx.fillStyle = color;
    ctx.textAlign = alinear;
    ctx.textBaseline = 'middle';
    ctx.fillText(contenido, x, y);
};

export const exportarRecorrido = async ({ plantilla, dron, ruta, rastro, aeronave }) => {
    const puntos = [...rastro, ...ruta.puntos, dron.lngLat];
    const { zoom, centro } = encuadrarRecorrido(puntos);
    const alto = ALTO - CABECERA;
    const lienzo = document.createElement('canvas');
    lienzo.width = ANCHO;
    lienzo.height = ALTO;
    const ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#EEF1F4';
    ctx.fillRect(0, 0, ANCHO, ALTO);
    if (plantilla) {
        const teselas = teselasVisibles(centro, ANCHO, alto, zoom);
        const imagenes = await Promise.all(teselas.map(({ tx, ty }) => cargar(urlTesela(plantilla, zoom, tx, ty))));
        teselas.forEach(({ x, y }, i) => { if (imagenes[i]) ctx.drawImage(imagenes[i], x, y + CABECERA, 256, 256); });
    }
    const aPx = (p) => {
        const [x, y] = aMinimapa(centro, p, ANCHO, alto, zoom);
        return [x, y + CABECERA];
    };
    dibujarRecorrido(ctx, { inicio: dron.lngLat, ruta: { ...ruta, pausada: false }, rastro, aPx, escala: 2 });
    if (rastro.length) {
        const [ix, iy] = aPx(rastro[0]);
        ctx.fillStyle = '#1F9D55';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(ix, iy, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    const [dx, dy] = aPx(dron.lngLat);
    ctx.save();
    ctx.translate(dx, dy);
    ctx.scale(2, 2);
    flecha(ctx, 0, 0, dron.rumbo);
    ctx.restore();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, ANCHO, CABECERA);
    ctx.fillStyle = '#5C2472';
    ctx.fillRect(0, CABECERA - 6, ANCHO, 6);
    const fecha = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    texto(ctx, 'Recorrido en dron', 48, 46, 34, 800, '#2E4372');
    texto(ctx, `${aeronave} · ${fecha}`, 48, 88, 20, 600, '#6A6180');
    const volado = rastro.length > 1 ? largoDeRuta(rastro[0], rastro.slice(1)) : 0;
    const pendiente = largoDeRuta(dron.lngLat, ruta.puntos, ruta.ciclo);
    texto(ctx, `Volado: ${formato.format(volado / 1000)} km`, ANCHO - 48, 46, 22, 800, '#5C2472', 'right');
    texto(ctx, `Ruta: ${ruta.puntos.length} ${ruta.puntos.length === 1 ? 'punto' : 'puntos'} · ${formato.format(pendiente / 1000)} km`, ANCHO - 48, 88, 20, 600, '#FF8300', 'right');
    texto(ctx, 'mapalab · IIEG Jalisco · © OpenStreetMap · © CARTO', ANCHO - 24, ALTO - 20, 16, 600, '#2E4372', 'right');
    return new Promise(resolver => lienzo.toBlob(resolver, 'image/png'));
};
