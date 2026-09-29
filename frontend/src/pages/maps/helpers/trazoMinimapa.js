import { aPixel } from './minimapa';

const COLORES = {
    fondo: '#EEF1F4',
    tierra: '#FFFFFF',
    borde: '#B9AEC6',
    contorno: '#6E5A82',
    contornoDeCerca: '#A3A7AB',
    halo: 'rgba(255, 255, 255, 0.9)',
    velo: 'rgba(255, 255, 255, 0.85)',
    municipio: 'rgba(92, 36, 114, 0.14)',
    municipioBorde: '#5C2472',
    vista: '#FF8300',
    vistaRelleno: 'rgba(255, 131, 0, 0.16)',
};

const MINIMO_RECTANGULO = 6;
const GROSOR_DE_CERCA = 2;
const FUENTE_NOMBRE = '700 12px Garet, Figtree, system-ui, sans-serif';
const MARGEN_NOMBRE = 6;

const poligonosDe = (geometria) => {
    if (!geometria) return [];
    const tipo = geometria.getType();
    if (tipo === 'Polygon') return [geometria.getCoordinates()];
    if (tipo === 'MultiPolygon') return geometria.getCoordinates();
    return [];
};

const trazarGeometria = (ctx, geometria, aPx) => {
    ctx.beginPath();
    poligonosDe(geometria).forEach(anillos => anillos.forEach((anillo) => {
        anillo.forEach((coordenada, i) => {
            const [x, y] = aPx(coordenada);
            if (i) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
        });
        ctx.closePath();
    }));
};

const conHalo = (ctx, color, ancho) => {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = COLORES.halo;
    ctx.lineWidth = ancho + 2.5;
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = ancho;
    ctx.stroke();
};

const dibujarVista = (ctx, extensionVista, aPx) => {
    const [x0, y1] = aPx([extensionVista[0], extensionVista[1]]);
    const [x1, y0] = aPx([extensionVista[2], extensionVista[3]]);
    const ancho = Math.max(x1 - x0, MINIMO_RECTANGULO);
    const alto = Math.max(y1 - y0, MINIMO_RECTANGULO);
    const izquierda = (x0 + x1) / 2 - ancho / 2;
    const arriba = (y0 + y1) / 2 - alto / 2;
    ctx.fillStyle = COLORES.vistaRelleno;
    ctx.fillRect(izquierda, arriba, ancho, alto);
    ctx.strokeStyle = COLORES.vista;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(izquierda, arriba, ancho, alto);
};

const puntoInterior = (geometria) => {
    if (geometria.getType() === 'Polygon') return geometria.getInteriorPoint().getCoordinates();
    if (geometria.getType() !== 'MultiPolygon') return null;
    const mayor = geometria.getPolygons().reduce((a, b) => (b.getArea() > a.getArea() ? b : a));
    return mayor.getInteriorPoint().getCoordinates();
};

const acotar = (valor, minimo, maximo) => Math.min(Math.max(valor, minimo), maximo);

const dibujarNombre = (ctx, municipio, aPx, lado) => {
    const punto = puntoInterior(municipio.geometry);
    if (!punto) return;
    ctx.font = FUENTE_NOMBRE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const mitad = ctx.measureText(municipio.nombre).width / 2;
    const [px, py] = aPx(punto);
    const x = acotar(px, mitad + MARGEN_NOMBRE, lado - mitad - MARGEN_NOMBRE);
    const y = acotar(py, MARGEN_NOMBRE * 2, lado - MARGEN_NOMBRE * 2);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = COLORES.halo;
    ctx.strokeText(municipio.nombre, x, y);
    ctx.fillStyle = COLORES.municipioBorde;
    ctx.fillText(municipio.nombre, x, y);
};

export const dibujarMinimapa = (ctx, { lado, vista, estado, municipio, extensionVista, sinFondo = false }) => {
    const aPx = coordenada => aPixel(vista, lado, coordenada);
    const grosor = vista?.modo === 'cerca' ? GROSOR_DE_CERCA : 1;
    ctx.clearRect(0, 0, lado, lado);
    if (!sinFondo) {
        ctx.fillStyle = COLORES.fondo;
        ctx.fillRect(0, 0, lado, lado);
    }

    if (estado) {
        trazarGeometria(ctx, estado, aPx);
        if (!sinFondo || vista?.modo !== 'cerca') {
            ctx.fillStyle = sinFondo ? COLORES.velo : COLORES.tierra;
            ctx.fill('evenodd');
        }
        if (vista?.modo === 'cerca') {
            ctx.strokeStyle = COLORES.contornoDeCerca;
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            conHalo(ctx, sinFondo ? COLORES.contorno : COLORES.borde, 1.5);
        }
    }

    if (municipio?.geometry) {
        trazarGeometria(ctx, municipio.geometry, aPx);
        if (sinFondo && vista?.modo === 'cerca') {
            ctx.fillStyle = COLORES.velo;
            ctx.fill('evenodd');
        }
        ctx.fillStyle = COLORES.municipio;
        ctx.fill('evenodd');
        conHalo(ctx, COLORES.municipioBorde, grosor);
    }

    if (extensionVista) dibujarVista(ctx, extensionVista, aPx);
    if (municipio?.nombre && municipio.geometry) dibujarNombre(ctx, municipio, aPx, lado);
};
