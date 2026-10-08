const PREFIJOS_PROPIOS = ['mapalab', 'devtools-'];
const PREFIJO_DEVTOOLS = 'devtools-';

export const ALMACENES = {
    local: () => window.localStorage,
    session: () => window.sessionStorage,
};

export const esPropia = (llave) => PREFIJOS_PROPIOS.some(prefijo => llave.startsWith(prefijo));

export const bytesDe = (llave, valor) => (llave.length + (valor || '').length) * 2;

export const formatoBytes = (bytes) => (bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`);

export const valorLegible = (valor) => {
    try {
        return JSON.stringify(JSON.parse(valor), null, 2);
    } catch {
        return valor;
    }
};

export const leerAlmacen = (tipo) => {
    try {
        const almacen = ALMACENES[tipo]();
        return Array.from({ length: almacen.length }, (_, i) => almacen.key(i))
            .filter(llave => llave !== null)
            .map(llave => {
                const valor = almacen.getItem(llave);
                return { llave, valor, bytes: bytesDe(llave, valor), propia: esPropia(llave) };
            })
            .sort((a, b) => b.bytes - a.bytes);
    } catch {
        return [];
    }
};

export const borrarLlave = (tipo, llave) => {
    try {
        ALMACENES[tipo]().removeItem(llave);
    } catch {
        return;
    }
};

export const borrarPropias = (tipo) => {
    leerAlmacen(tipo)
        .filter(({ llave, propia }) => propia && !llave.startsWith(PREFIJO_DEVTOOLS))
        .forEach(({ llave }) => borrarLlave(tipo, llave));
};
