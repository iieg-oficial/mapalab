const LLAVE = 'mapalab.sider.candado';
const MODOS = ['auto', 'expanded', 'collapsed', 'mobile'];

export const leerCandado = () => {
    try {
        const guardado = localStorage.getItem(LLAVE);
        return MODOS.includes(guardado) ? guardado : 'auto';
    } catch {
        return 'auto';
    }
};

export const guardarCandado = (modo) => {
    try {
        if (MODOS.includes(modo)) localStorage.setItem(LLAVE, modo);
    } catch {
        /* ignore */
    }
};
