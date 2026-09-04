const LLAVE = 'mapalab.tabla.estado';
const VERSION = 1;

export const ESTADO_INICIAL = {
    activo: false,
    activaId: null,
    acople: 'flotante',
    altoAcople: null,
    modoPrevioSider: null,
    porCapa: {},
};

export const leerEstado = () => {
    try {
        const crudo = JSON.parse(localStorage.getItem(LLAVE) || 'null');
        if (!crudo || crudo.version !== VERSION) return { ...ESTADO_INICIAL };
        return {
            ...ESTADO_INICIAL,
            ...crudo.estado,
            porCapa: crudo.estado?.porCapa && typeof crudo.estado.porCapa === 'object'
                ? crudo.estado.porCapa
                : {},
        };
    } catch {
        return { ...ESTADO_INICIAL };
    }
};

export const guardarEstado = (estado) => {
    try {
        localStorage.setItem(LLAVE, JSON.stringify({ version: VERSION, estado }));
    } catch {
        /* ignore */
    }
};
