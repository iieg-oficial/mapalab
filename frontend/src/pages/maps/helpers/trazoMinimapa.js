import { aPixel } from './minimapa';

const COLORES = {
    fondo: '#EEF1F4',
    tierra: '#FFFFFF',
    borde: '#B9AEC6',
    municipio: 'rgba(92, 36, 114, 0.14)',
    municipioBorde: '#5C2472',
    vista: '#FF8300',
    vistaRelleno: 'rgba(255, 131, 0, 0.16)',
};

const MINIMO_RECTANGULO = 6;

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

export const dibujarMinimapa = (ctx, { lado, vista, estado, municipio, extensionVista }) => {
    const aPx = coordenada => aPixel(vista, lado, coordenada);
    ctx.fillStyle = COLORES.fondo;
    ctx.fillRect(0, 0, lado, lado);

    if (estado) {
        trazarGeometria(ctx, estado, aPx);
        ctx.fillStyle = COLORES.tierra;
        ctx.fill('evenodd');
        ctx.strokeStyle = COLORES.borde;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    if (municipio?.geometry) {
        trazarGeometria(ctx, municipio.geometry, aPx);
        ctx.fillStyle = COLORES.municipio;
        ctx.fill('evenodd');
        ctx.strokeStyle = COLORES.municipioBorde;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    if (!extensionVista) return;
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
