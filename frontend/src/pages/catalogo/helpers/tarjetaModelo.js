import { blockInstances, normalizeConfig } from '@utils/infoboxPlan';
import { esEditable, ordenBase, textoConContacto, tipoDeLlave } from './tarjetaFusion';

export const MAX_FILAS = 12;
export const MAX_TEXTOS = 3;
export const MAX_ETIQUETA = 80;
export const MAX_PARRAFO = 300;

const PERMITIDAS = {
    list: ['field', 'compose', 'sep', 'label', 'href', 'formato', 'raw', 'split'],
    cards: ['field', 'compose', 'sep', 'label', 'suffix', 'decimals', 'op', 'raw'],
    text: ['field', 'compose', 'sep', 'label', 'href', 'formato'],
};

let contador = 0;
const uid = () => {
    contador += 1;
    return `u${contador}`;
};

const conUid = (item) => ({ ...(typeof item === 'object' && item ? item : {}), uid: uid() });

const itemsDe = (config, tipo) => blockInstances(config, tipo).flatMap((instancia) => instancia.items || []);

export const modeloDesdeConfig = (base) => {
    const config = normalizeConfig(base && typeof base === 'object' ? base : {}) || {};
    const textos = blockInstances(config, 'text');
    const bloques = ordenBase(config).filter(esEditable).map((llave) => {
        const tipo = tipoDeLlave(llave);
        if (tipo === 'text') {
            const instancia = textos.find((t) => t.key === llave);
            return { key: llave, tipo, id: instancia?.id || 't0', items: (instancia?.items || []).map(conUid) };
        }
        return { key: tipo, tipo, items: itemsDe(config, tipo).map(conUid) };
    });
    const unicos = bloques.filter((b, i) => bloques.findIndex((otro) => otro.key === b.key) === i);
    return { titulo: config.headerField || null, bloques: unicos };
};

const limpiarCompose = (compose) => (compose || [])
    .map((parte) => (typeof parte === 'string' ? { field: parte } : parte))
    .filter((parte) => parte?.field)
    .map((parte) => Object.fromEntries(
        ['field', 'prefix', 'suffix'].filter((k) => parte[k]).map((k) => [k, parte[k]]),
    ));

const limpiarItem = (tipo) => (item) => {
    const salida = {};
    PERMITIDAS[tipo].forEach((clave) => {
        const valor = item[clave];
        if (valor === undefined || valor === null || valor === '' || valor === false) return;
        salida[clave] = valor;
    });
    if (salida.compose) {
        salida.compose = limpiarCompose(salida.compose);
        delete salida.field;
    } else {
        delete salida.sep;
        delete salida.op;
    }
    if (salida.op && salida.op !== 'sum') delete salida.op;
    if (salida.op === 'sum') delete salida.sep;
    if (salida.formato !== 'anio') delete salida.formato;
    if (typeof salida.label === 'string') salida.label = salida.label.trim();
    if (!salida.label) delete salida.label;
    return salida;
};

const tituloLimpio = (titulo) => {
    if (typeof titulo === 'string') return titulo.trim() || null;
    if (titulo?.compose) {
        const compose = limpiarCompose(titulo.compose);
        if (!compose.length) return null;
        return titulo.sep ? { compose, sep: titulo.sep } : { compose };
    }
    return null;
};

export const configDesdeModelo = (modelo) => {
    const config = {};
    const titulo = tituloLimpio(modelo.titulo);
    if (titulo) config.headerField = titulo;
    const textos = [];
    modelo.bloques.forEach((bloque) => {
        const items = bloque.items.map(limpiarItem(bloque.tipo));
        if (!items.length) return;
        if (bloque.tipo === 'text') textos.push({ id: bloque.id, items });
        else config[bloque.tipo] = items;
    });
    if (textos.length) config.text = textos;
    const orden = modelo.bloques
        .filter((b) => b.items.length)
        .map((b) => b.key);
    if (orden.length) config.blockOrder = orden;
    return config;
};

const conBloque = (modelo, key, fn) => ({
    ...modelo,
    bloques: modelo.bloques.map((b) => (b.key === key ? fn(b) : b)),
});

export const puedeAgregarBloque = (modelo, tipo) => (tipo === 'text'
    ? modelo.bloques.filter((b) => b.tipo === 'text').length < MAX_TEXTOS
    : !modelo.bloques.some((b) => b.tipo === tipo));

export const agregarBloque = (modelo, tipo) => {
    if (!puedeAgregarBloque(modelo, tipo)) return { modelo, key: null };
    let bloque = { key: tipo, tipo, items: [] };
    if (tipo === 'text') {
        const usados = new Set(modelo.bloques.filter((b) => b.tipo === 'text').map((b) => b.id));
        let n = 0;
        while (usados.has(`t${n}`)) n += 1;
        bloque = { key: `text:t${n}`, tipo, id: `t${n}`, items: [] };
    }
    return { modelo: { ...modelo, bloques: [...modelo.bloques, bloque] }, key: bloque.key };
};

export const quitarBloque = (modelo, key) => ({ ...modelo, bloques: modelo.bloques.filter((b) => b.key !== key) });

const mover = (lista, desde, delta) => {
    const hasta = desde + delta;
    if (desde < 0 || hasta < 0 || hasta >= lista.length) return lista;
    const copia = [...lista];
    const [movido] = copia.splice(desde, 1);
    copia.splice(hasta, 0, movido);
    return copia;
};

export const moverBloque = (modelo, key, delta) => ({
    ...modelo,
    bloques: mover(modelo.bloques, modelo.bloques.findIndex((b) => b.key === key), delta),
});

export const agregarItem = (modelo, key, item) => conBloque(modelo, key, (b) => (
    b.items.length >= MAX_FILAS ? b : { ...b, items: [...b.items, conUid(item)] }
));

export const actualizarItem = (modelo, key, itemUid, parche) => conBloque(modelo, key, (b) => ({
    ...b,
    items: b.items.map((item) => (item.uid === itemUid ? { ...item, ...parche } : item)),
}));

export const quitarItem = (modelo, key, itemUid) => conBloque(modelo, key, (b) => ({
    ...b,
    items: b.items.filter((item) => item.uid !== itemUid),
}));

export const moverItem = (modelo, key, itemUid, delta) => conBloque(modelo, key, (b) => ({
    ...b,
    items: mover(b.items, b.items.findIndex((item) => item.uid === itemUid), delta),
}));

export const fijarTitulo = (modelo, titulo) => ({ ...modelo, titulo });

const textosDe = (item) => [
    item.label,
    item.suffix,
    item.sep,
    ...(item.compose || []).flatMap((p) => (typeof p === 'object' && p ? [p.prefix, p.suffix] : [])),
].filter((t) => typeof t === 'string' && t);

const problemaDeItem = (tipo, item) => {
    const origen = item.field || (item.compose || []).some((p) => (typeof p === 'string' ? p : p?.field));
    if (tipo !== 'text' && !origen) return 'Elige un campo.';
    if (tipo !== 'text' && !String(item.label || '').trim()) return 'Ponle nombre.';
    if (tipo === 'text' && !origen && !String(item.label || '').trim()) return 'Escribe el texto o elige un campo.';
    if (textosDe(item).some(textoConContacto)) return 'Sin links, correos ni teléfonos.';
    return null;
};

export const problemasDe = (modelo) => {
    const porItem = {};
    modelo.bloques.forEach((bloque) => bloque.items.forEach((item) => {
        const problema = problemaDeItem(bloque.tipo, item);
        if (problema) porItem[item.uid] = problema;
    }));
    const titulo = typeof modelo.titulo === 'string' && textoConContacto(modelo.titulo)
        ? 'Sin links, correos ni teléfonos.'
        : null;
    const config = configDesdeModelo(modelo);
    const vacia = !config.headerField && !modelo.bloques.some((b) => b.items.length);
    return { porItem, titulo, vacia, hay: vacia || !!titulo || Object.keys(porItem).length > 0 };
};
