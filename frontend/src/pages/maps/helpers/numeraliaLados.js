import { aNumero } from '@hooksMaps/useNumeraliaComparador';
import { cqlToDateRange } from '@pages/maps/helpers/dateFilterHelpers';
import { slotMembershipOf } from '@pages/maps/helpers/swipeMode';

export const filasDeLados = (numeraliaA, numeraliaB) => {
    const deB = new Map((numeraliaB || []).map(slot => [slot.nombre, slot]));
    return (numeraliaA || []).filter(slot => slot.nombre).map(slot => {
        const otro = deB.get(slot.nombre);
        const a = aNumero(slot.valor);
        const b = aNumero(otro?.valor);
        const delta = a === null || b === null ? null : b - a;
        return {
            nombre: slot.nombre,
            simbolo: slot.simbolo,
            a: slot.valor ?? null,
            b: otro?.valor ?? null,
            delta,
            cambio: delta === null || a === 0 ? null : (delta / Math.abs(a)) * 100,
        };
    });
};

export const conFechas = (base, cql) => {
    const rango = cql ? cqlToDateRange(cql) : null;
    if (!rango) return base;
    return { ...(base || {}), fechaInicio: rango.dateFrom, fechaFin: rango.dateTo };
};

export const ladoDe = (compareMode, layerId) => {
    if (!compareMode?.active || !layerId) return { lado: null, ambos: false };
    const membresia = slotMembershipOf(compareMode, [layerId]);
    if (membresia === 'A' || membresia === 'B') return { lado: membresia, ambos: false };
    return { lado: compareMode.activeSlot === 'B' ? 'B' : 'A', ambos: membresia === 'AB' };
};

export const candidatasDelOtroLado = (compareMode, lado, layerId) => {
    if (!compareMode?.active || !lado) return [];
    const otro = lado === 'A' ? 'B' : 'A';
    const panel = compareMode[`pane${otro}`] || {};
    const propio = compareMode[`pane${lado}`]?.activeLayerIds || [];
    const ocultas = new Set(panel.hiddenLayerIds || []);
    return (panel.activeLayerIds || []).filter(id => id !== layerId && !ocultas.has(id) && !propio.includes(id));
};
