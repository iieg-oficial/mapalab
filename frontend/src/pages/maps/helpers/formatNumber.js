const NBSP = '\u00A0';

export const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') return value;

    const str = String(value);
    const parts = str.split('.');
    const intPart = parts[0];

    const isNegative = intPart.startsWith('-');
    const digits = isNegative ? intPart.slice(1) : intPart;

    if (digits.length <= 3 || !/^\d+$/.test(digits)) return str;

    const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
    const result = isNegative ? `-${formatted}` : formatted;

    return parts.length > 1 ? `${result}.${parts[1]}` : result;
};
