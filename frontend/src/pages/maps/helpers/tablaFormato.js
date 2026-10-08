export const formatearValor = (valor, formato) => {
    if (valor === null || valor === undefined || valor === '') return '—';
    if (formato === 'entero') return Number(valor).toLocaleString('es-MX', { maximumFractionDigits: 0 });
    if (formato === 'decimal') return Number(valor).toLocaleString('es-MX', { maximumFractionDigits: 2 });
    if (formato === 'moneda') return Number(valor).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    return String(valor);
};
