const ZOOM_MOSTRAR = 10;
const ZOOM_OCULTAR = 9.6;
export const ZOOM_CERCA = 13;
const NIVELES_ATRAS = 4;
export const TAMANO_MINIMAPA = 176;
const RESERVA_SUPERIOR = 72;
const ALTO_MINIMO = 560;
const ANCHO_MINIMO = 768;

const RESOLUCION_ZOOM_0 = 156543.03392804097;
const MARGEN_JALISCO = 0.08;

export const resolucionDeZoom = zoom => RESOLUCION_ZOOM_0 / 2 ** zoom;

export const sigueVisible = (visible, zoom) => {
    if (!Number.isFinite(zoom)) return false;
    return visible ? zoom >= ZOOM_OCULTAR : zoom >= ZOOM_MOSTRAR;
};

const IZQUIERDA_MINIMA = 400;
const MAX_VUELTAS = 12;

const seEnciman = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

const cajaEn = ({ ancho, alto, abajo, derecha, tamano }) => ({
    left: ancho - derecha - tamano,
    right: ancho - derecha,
    top: alto - abajo - tamano,
    bottom: alto - abajo,
});

const esquivar = (medidas, cajas, mover) => {
    let posicion = { abajo: medidas.base, derecha: medidas.borde };
    for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta += 1) {
        const propia = cajaEn({ ...medidas, ...posicion });
        const choque = cajas.find(caja => seEnciman(propia, caja));
        if (!choque) return posicion;
        posicion = mover(posicion, choque);
    }
    return null;
};

export const ubicarMinimapa = ({
    ancho, alto, cajas = [], tamano = TAMANO_MINIMAPA, base = 16, borde = 16, separacion = 12,
}) => {
    if (ancho < ANCHO_MINIMO || alto < ALTO_MINIMO) return null;
    const medidas = { ancho, alto, tamano, base, borde };
    const arriba = esquivar(medidas, cajas, (posicion, caja) => ({ ...posicion, abajo: alto - caja.top + separacion }));
    if (arriba && alto - arriba.abajo - tamano >= RESERVA_SUPERIOR) return arriba;
    const izquierda = esquivar(medidas, cajas, (posicion, caja) => ({ ...posicion, derecha: ancho - caja.left + separacion }));
    if (izquierda && ancho - izquierda.derecha - tamano >= IZQUIERDA_MINIMA) return izquierda;
    return null;
};

export const vistaDelMinimapa = ({ centro, zoom, extensionEstado, lado }) => {
    if (zoom >= ZOOM_CERCA || !extensionEstado) {
        return { modo: 'cerca', centro, resolucion: resolucionDeZoom(zoom - NIVELES_ATRAS) };
    }
    const [minX, minY, maxX, maxY] = extensionEstado;
    const mayor = Math.max(maxX - minX, maxY - minY);
    return {
        modo: 'estado',
        centro: [(minX + maxX) / 2, (minY + maxY) / 2],
        resolucion: (mayor * (1 + MARGEN_JALISCO * 2)) / lado,
    };
};

export const aPixel = ({ centro, resolucion }, lado, [x, y]) => [
    lado / 2 + (x - centro[0]) / resolucion,
    lado / 2 - (y - centro[1]) / resolucion,
];

export const dePixel = ({ centro, resolucion }, lado, [px, py]) => [
    centro[0] + (px - lado / 2) * resolucion,
    centro[1] - (py - lado / 2) * resolucion,
];

export const municipioEn = (municipios, coordenada) => {
    if (!coordenada || !Array.isArray(municipios)) return null;
    return municipios.find(item => item.geometry?.intersectsCoordinate?.(coordenada)) || null;
};
