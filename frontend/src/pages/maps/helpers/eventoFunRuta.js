const esPunto = (p) => Number.isFinite(p?.lon) && Number.isFinite(p?.lat);

export const verticesDeDestino = (destino) => {
    if (!esPunto(destino)) return [];
    const ruta = Array.isArray(destino.ruta) ? destino.ruta.filter(esPunto) : [];
    return [...ruta.map((p) => [p.lon, p.lat]), [destino.lon, destino.lat]];
};

export const tieneRuta = (destino) => verticesDeDestino(destino).length > 1;

const RADIO_TIERRA_M = 6378137;

const tramoMetros = ([lon1, lat1], [lon2, lat2]) => {
    const rad = Math.PI / 180;
    const x = (lon2 - lon1) * rad * Math.cos(((lat1 + lat2) / 2) * rad);
    const y = (lat2 - lat1) * rad;
    return Math.hypot(x, y) * RADIO_TIERRA_M;
};

export const longitudDeRuta = (vertices) => {
    if (!Array.isArray(vertices) || vertices.length < 2) return 0;
    return vertices.slice(1).reduce((suma, v, i) => suma + tramoMetros(vertices[i], v), 0);
};

export const puntoEnRuta = (vertices, s) => {
    if (!Array.isArray(vertices) || vertices.length === 0) return null;
    if (vertices.length === 1) return vertices[0];
    const total = longitudDeRuta(vertices);
    if (total === 0) return vertices[0];
    const meta = Math.min(1, Math.max(0, s)) * total;
    let recorrido = 0;
    for (let i = 1; i < vertices.length; i += 1) {
        const tramo = tramoMetros(vertices[i - 1], vertices[i]);
        if (recorrido + tramo >= meta || i === vertices.length - 1) {
            const u = tramo === 0 ? 0 : Math.min(1, (meta - recorrido) / tramo);
            return [
                vertices[i - 1][0] + (vertices[i][0] - vertices[i - 1][0]) * u,
                vertices[i - 1][1] + (vertices[i][1] - vertices[i - 1][1]) * u,
            ];
        }
        recorrido += tramo;
    }
    return vertices[vertices.length - 1];
};

export const rumboEntre = ([lon1, lat1], [lon2, lat2]) => {
    const rad = Math.PI / 180;
    const y = Math.sin((lon2 - lon1) * rad) * Math.cos(lat2 * rad);
    const x = Math.cos(lat1 * rad) * Math.sin(lat2 * rad)
        - Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos((lon2 - lon1) * rad);
    return (Math.atan2(y, x) / rad + 360) % 360;
};

export const extentDeRuta = (vertices) => {
    if (!Array.isArray(vertices) || vertices.length === 0) return null;
    return vertices.reduce(
        (e, [lon, lat]) => [Math.min(e[0], lon), Math.min(e[1], lat), Math.max(e[2], lon), Math.max(e[3], lat)],
        [Infinity, Infinity, -Infinity, -Infinity],
    );
};
