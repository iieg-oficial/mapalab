const esPunto = (p) => Number.isFinite(p?.lon) && Number.isFinite(p?.lat);

export const verticesDeDestino = (destino) => {
    if (!esPunto(destino)) return [];
    const ruta = Array.isArray(destino.ruta) ? destino.ruta.filter(esPunto) : [];
    return [...ruta.map((p) => [p.lon, p.lat]), [destino.lon, destino.lat]];
};

export const tieneRuta = (destino) => verticesDeDestino(destino).length > 1;
