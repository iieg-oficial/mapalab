const COLLAPSE_KEY = 'mapalab.tools.collapsed';

export const leerPreferenciaCompacta = () => {
    try { return localStorage.getItem(COLLAPSE_KEY); } catch { return null; }
};

export const guardarPreferenciaCompacta = (valor) => {
    try { localStorage.setItem(COLLAPSE_KEY, valor); } catch { /* storage apagado */ }
};

export const resolveToolsCollapsed = ({ isMobile, esCompacto, preferencia }) => {
    if (isMobile) return true;
    if (preferencia !== '0' && preferencia !== '1') return esCompacto;
    return preferencia === '1';
};
