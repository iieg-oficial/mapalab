const ZOOM_MOSTRAR = 10;
const ZOOM_OCULTAR = 9.6;
export const ZOOM_CERCA = 13;
const NIVELES_ATRAS = 4;
export const TAMANO_MINIMAPA = 176;

const RESOLUCION_ZOOM_0 = 156543.03392804097;
const MARGEN_JALISCO = 0.08;
const MARGEN_MUNICIPIO = 0.1;

export const resolucionDeZoom = zoom => RESOLUCION_ZOOM_0 / 2 ** zoom;

export const sigueVisible = (visible, zoom) => {
    if (!Number.isFinite(zoom)) return false;
    return visible ? zoom >= ZOOM_OCULTAR : zoom >= ZOOM_MOSTRAR;
};

const resolucionParaVer = (centro, [minX, minY, maxX, maxY], lado) => {
    const mitad = Math.max(centro[0] - minX, maxX - centro[0], centro[1] - minY, maxY - centro[1]);
    return (2 * mitad) / (lado * (1 - MARGEN_MUNICIPIO * 2));
};

export const vistaDelMinimapa = ({ centro, zoom, extensionEstado, extensionMunicipio, lado }) => {
    if (zoom >= ZOOM_CERCA || !extensionEstado) {
        const cercana = resolucionDeZoom(zoom - NIVELES_ATRAS);
        const resolucion = extensionMunicipio ? Math.max(cercana, resolucionParaVer(centro, extensionMunicipio, lado)) : cercana;
        return { modo: 'cerca', centro, resolucion };
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
