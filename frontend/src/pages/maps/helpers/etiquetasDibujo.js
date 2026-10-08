const PREFIJO = 'etq:';
const estilos = new Map();

const mayor = (lista, medida) => lista.reduce((mejor, actual) => (medida(actual) > medida(mejor) ? actual : mejor), lista[0]);

export const puntoDeEtiqueta = (geometria) => {
    const tipo = geometria?.getType?.();
    if (tipo === 'Point') return geometria.getCoordinates().slice(0, 2);
    if (tipo === 'MultiPoint') return geometria.getCoordinates()[0]?.slice(0, 2) || null;
    if (tipo === 'Polygon') return geometria.getInteriorPoint().getCoordinates().slice(0, 2);
    if (tipo === 'MultiPolygon') {
        const poligonos = geometria.getPolygons();
        return poligonos.length ? mayor(poligonos, p => p.getArea()).getInteriorPoint().getCoordinates().slice(0, 2) : null;
    }
    if (tipo === 'LineString') return geometria.getCoordinateAt(0.5).slice(0, 2);
    if (tipo === 'MultiLineString') {
        const lineas = geometria.getLineStrings();
        return lineas.length ? mayor(lineas, l => l.getLength()).getCoordinateAt(0.5).slice(0, 2) : null;
    }
    return null;
};

export const idDeEtiqueta = (clave) => ['concat', `${PREFIJO}${clave}|`, ['get', '_texto']];

export const registrarEstiloDeEtiqueta = (clave, estilo) => estilos.set(clave, estilo);

const dibujar = (texto, estilo, ratio) => {
    const tamano = Math.round(estilo.tamano * ratio);
    const halo = Math.round((estilo.halo?.radio || 0) * 2 * ratio);
    const fuente = `${estilo.peso === 'bold' ? 700 : 500} ${tamano}px Garet, Inter, sans-serif`;
    const medidor = document.createElement('canvas').getContext('2d');
    medidor.font = fuente;
    const margen = halo + Math.round(4 * ratio);
    const ancho = Math.ceil(medidor.measureText(texto).width) + margen * 2;
    const alto = Math.ceil(tamano * 1.3) + margen * 2;
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext('2d');
    ctx.font = fuente;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(26, 38, 100, 0.35)';
    ctx.shadowBlur = 4 * ratio;
    ctx.shadowOffsetY = 1 * ratio;
    if (halo) {
        ctx.lineJoin = 'round';
        ctx.lineWidth = halo;
        ctx.strokeStyle = estilo.halo.color;
        ctx.strokeText(texto, ancho / 2, alto / 2);
        ctx.shadowColor = 'transparent';
    }
    ctx.fillStyle = estilo.color;
    ctx.fillText(texto, ancho / 2, alto / 2);
    return { width: ancho, height: alto, data: ctx.getImageData(0, 0, ancho, alto).data };
};

export const asegurarImagenesDeEtiqueta = (map, clave, textos) => {
    const estilo = estilos.get(clave);
    if (!estilo) return;
    const ratio = window.devicePixelRatio || 1;
    textos.forEach((texto) => {
        const id = `${PREFIJO}${clave}|${texto}`;
        if (!map.hasImage(id)) map.addImage(id, dibujar(texto, estilo, ratio), { pixelRatio: ratio });
    });
};

export const registrarEtiquetas = (map) => {
    const alFaltar = ({ id }) => {
        const texto = String(id);
        if (!texto.startsWith(PREFIJO) || map.hasImage(id)) return;
        const separador = texto.indexOf('|');
        const estilo = estilos.get(texto.slice(PREFIJO.length, separador));
        if (!estilo) return;
        const ratio = window.devicePixelRatio || 1;
        map.addImage(id, dibujar(texto.slice(separador + 1), estilo, ratio), { pixelRatio: ratio });
    };
    map.on('styleimagemissing', alFaltar);
    return () => map.off('styleimagemissing', alFaltar);
};
