const PREFIJO_ISO = /^(\d{4})-\d{2}-\d{2}/;

const anioDe = (valor) => {
    const texto = String(valor).trim();
    const iso = texto.match(PREFIJO_ISO);
    if (iso) return iso[1];
    const fecha = new Date(texto);
    return Number.isNaN(fecha.getTime()) ? null : String(fecha.getUTCFullYear());
};

export const aplicarFormato = (valor, formato) => {
    if (formato !== 'anio') return valor;
    if (valor === null || valor === undefined || valor === '') return valor;
    return anioDe(valor) ?? valor;
};
