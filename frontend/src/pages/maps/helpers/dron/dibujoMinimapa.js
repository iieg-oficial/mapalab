import { aMinimapa, deMinimapa, girar, teselasVisibles, urlTesela } from './minimapaDron';

const MORADO = '#5C2472';
const NARANJA = '#FF8300';
const GRIS = '#8A8298';

export const flecha = (ctx, x, y, grados) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((grados * Math.PI) / 180);
    const brillo = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
    brillo.addColorStop(0, 'rgba(255, 131, 0, 0.35)');
    brillo.addColorStop(1, 'rgba(255, 131, 0, 0)');
    ctx.fillStyle = brillo;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 40, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55); ctx.closePath(); ctx.fill();
    ctx.fillStyle = MORADO;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(0, 3); ctx.lineTo(-6, 6); ctx.closePath();
    ctx.stroke(); ctx.fill();
    ctx.restore();
};

const teselasDeFondo = (ctx, { centro, ancho, alto, zoom, plantilla, cache }) => {
    const lado = Math.ceil(Math.hypot(ancho, alto));
    const [dx, dy] = [(ancho - lado) / 2, (alto - lado) / 2];
    teselasVisibles(centro, lado, lado, zoom).forEach(({ tx, ty, x, y }) => {
        const url = urlTesela(plantilla, zoom, tx, ty);
        let img = cache.get(url);
        if (!img) {
            img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url;
            cache.set(url, img);
        }
        if (img.complete && img.naturalWidth) ctx.drawImage(img, x + dx, y + dy, 256, 256);
    });
};

const ESPERA_TESELA_MS = 6000;

export const precargarTeselas = ({ centro, ancho, alto, zoom, plantilla, cache }) => {
    if (!plantilla) return Promise.resolve();
    const lado = Math.ceil(Math.hypot(ancho, alto));
    return Promise.all(teselasVisibles(centro, lado, lado, zoom).map(({ tx, ty }) => new Promise((resolver) => {
        const url = urlTesela(plantilla, zoom, tx, ty);
        let img = cache.get(url);
        if (!img) {
            img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url;
            cache.set(url, img);
        }
        if (img.complete) {
            resolver();
            return;
        }
        const limite = setTimeout(resolver, ESPERA_TESELA_MS);
        const listo = () => { clearTimeout(limite); resolver(); };
        img.addEventListener('load', listo, { once: true });
        img.addEventListener('error', listo, { once: true });
    })));
};

export const linea = (ctx, puntos, color, ancho, guiones = []) => {
    if (puntos.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = ancho;
    ctx.setLineDash(guiones);
    ctx.beginPath();
    puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.setLineDash([]);
};

export const dibujarRecorrido = (ctx, { inicio, ruta, rastro, aPx, giro = 0, escala = 1 }) => {
    linea(ctx, rastro.map(aPx), 'rgba(92, 36, 114, 0.6)', 2 * escala);
    const color = ruta.pausada ? GRIS : NARANJA;
    const camino = [inicio, ...ruta.puntos, ...(ruta.ciclo && ruta.puntos.length > 1 ? [ruta.puntos[0]] : [])].map(aPx);
    linea(ctx, camino, color, 2.5 * escala, [6 * escala, 5 * escala]);
    ruta.puntos.forEach((p, i) => {
        const [x, y] = aPx(p);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((giro * Math.PI) / 180);
        ctx.scale(escala, escala);
        ctx.fillStyle = color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '800 9px Garet, Figtree, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), 0, 0.5);
        ctx.restore();
    });
};

export const dibujarMinimapa = (ctx, v) => {
    const { ancho, alto, zoom, centro, rumbo, rumboArriba, plantilla, cache, ruta, rastro } = v;
    const aPx = p => aMinimapa(centro, p, ancho, alto, zoom);
    ctx.fillStyle = '#EEF1F4';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.save();
    if (rumboArriba) {
        ctx.translate(ancho / 2, alto / 2);
        ctx.rotate((-rumbo * Math.PI) / 180);
        ctx.translate(-ancho / 2, -alto / 2);
    }
    if (plantilla) teselasDeFondo(ctx, { centro, ancho, alto, zoom, plantilla, cache });
    dibujarRecorrido(ctx, { inicio: centro, ruta, rastro, aPx, giro: rumboArriba ? rumbo : 0 });
    ctx.restore();
    flecha(ctx, ancho / 2, alto / 2, rumboArriba ? 0 : rumbo);
};

export const puntoDelClic = ({ centro, ancho, alto, zoom, rumbo, rumboArriba }, [px, py]) => {
    const relativo = [px - ancho / 2, py - alto / 2];
    const [rx, ry] = rumboArriba ? girar(relativo, rumbo) : relativo;
    return deMinimapa(centro, [ancho / 2 + rx, alto / 2 + ry], ancho, alto, zoom);
};
