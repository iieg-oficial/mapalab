const ESCALA_ZOOM_0 = 559082264.029;
const SLD_NS = 'http://www.opengis.net/sld';

const hijos = (nodo, nombre) => [...(nodo?.children || [])].filter(hijo => hijo.localName === nombre);
const hijo = (nodo, nombre) => hijos(nodo, nombre)[0] || null;
const descendientes = (nodo, nombre) => [...(nodo?.children || [])].flatMap(h => (h.localName === nombre ? [h] : []).concat(descendientes(h, nombre)));

const parametros = (nodo) => Object.fromEntries(
    hijos(nodo, 'CssParameter').concat(hijos(nodo, 'SvgParameter')).map(p => [p.getAttribute('name'), p.textContent.trim()]),
);

export const leerEtiqueta = (nodo) => [...(nodo?.childNodes || [])].flatMap((parte) => {
    if (parte.nodeType === 3) return parte.textContent.trim() ? [{ tipo: 'lit', valor: parte.textContent.trim() }] : [];
    if (parte.localName === 'PropertyName') return [{ tipo: 'prop', nombre: parte.textContent.trim() }];
    if (parte.localName === 'Literal') return [{ tipo: 'lit', valor: parte.textContent }];
    if (parte.localName === 'Function') return [{ tipo: 'concat', partes: leerEtiqueta(parte) }];
    return [];
});

export const textoDeEtiqueta = (partes, propiedades) => partes.map((parte) => {
    if (parte.tipo === 'prop') return propiedades?.[parte.nombre] ?? '';
    if (parte.tipo === 'concat') return textoDeEtiqueta(parte.partes, propiedades);
    return parte.valor;
}).join('').trim();

export const zoomsDeEscala = (minEscala, maxEscala) => ({
    ...(maxEscala ? { minzoom: Math.max(0, Math.log2(ESCALA_ZOOM_0 / maxEscala) - 1) } : {}),
    ...(minEscala ? { maxzoom: Math.min(24, Math.log2(ESCALA_ZOOM_0 / minEscala) - 1) } : {}),
});

const numero = (texto) => (texto ? Number(texto) : null);

const leerRegla = (regla, texto) => {
    const fuente = parametros(hijo(texto, 'Font'));
    const halo = hijo(texto, 'Halo');
    return {
        partes: leerEtiqueta(hijo(texto, 'Label')),
        tamano: Number(fuente['font-size']) || 12,
        peso: fuente['font-weight'] || 'normal',
        color: parametros(hijo(texto, 'Fill')).fill || '#1A1A1A',
        halo: halo ? { radio: Number(hijo(halo, 'Radius')?.textContent) || 1, color: parametros(hijo(halo, 'Fill')).fill || '#FFFFFF' } : null,
        minEscala: numero(hijo(regla, 'MinScaleDenominator')?.textContent),
        maxEscala: numero(hijo(regla, 'MaxScaleDenominator')?.textContent),
        filtrada: !!hijo(regla, 'Filter'),
    };
};

export const parsearSld = (xml) => {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const capa = descendientes(doc, 'NamedLayer')[0];
    if (!capa) return null;
    const nombre = hijo(capa, 'Name')?.textContent.trim();
    const estilo = hijos(capa, 'UserStyle')[0];
    if (!estilo) return { nombre, estilo: '', reglas: [], capaSinTexto: null };
    const reglas = descendientes(estilo, 'Rule').flatMap(regla => (
        hijos(regla, 'TextSymbolizer').map(texto => leerRegla(regla, texto))
    )).filter(regla => regla.partes.length > 0);
    const limpia = capa.cloneNode(true);
    descendientes(limpia, 'TextSymbolizer').forEach(nodo => nodo.parentNode.removeChild(nodo));
    return {
        nombre,
        estilo: hijo(estilo, 'Name')?.textContent.trim() || '',
        reglas,
        capaSinTexto: new XMLSerializer().serializeToString(limpia).replace(/>\s+</g, '><'),
    };
};

export const cuerpoSldSinTexto = (capas) => (
    `<sld:StyledLayerDescriptor xmlns:sld="${SLD_NS}" xmlns="${SLD_NS}" xmlns:ogc="http://www.opengis.net/ogc" version="1.0.0">`
    + capas.map(({ nombre, estilo, capaSinTexto }) => capaSinTexto || (estilo
        ? `<sld:NamedLayer><sld:Name>${nombre}</sld:Name><sld:NamedStyle><sld:Name>${estilo}</sld:Name></sld:NamedStyle></sld:NamedLayer>`
        : `<sld:NamedLayer><sld:Name>${nombre}</sld:Name></sld:NamedLayer>`)).join('')
    + '</sld:StyledLayerDescriptor>'
);
