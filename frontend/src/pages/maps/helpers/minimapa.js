const ZOOM_MOSTRAR = 10;
const ZOOM_OCULTAR = 9.6;
export const ZOOM_CERCA = 13;
const NIVELES_ATRAS = 4;
export const TAMANO_MINIMAPA = 176;

const RESOLUCION_ZOOM_0 = 156543.03392804097;
const MARGEN_JALISCO = 0.08;

export const resolucionDeZoom = zoom => RESOLUCION_ZOOM_0 / 2 ** zoom;

export const sigueVisible = (visible, zoom) => {
    if (!Number.isFinite(zoom)) return false;
    return visible ? zoom >= ZOOM_OCULTAR : zoom >= ZOOM_MOSTRAR;
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
