import { describe, expect, it } from 'vitest';
import { buildCardPlan } from '@utils/infoboxPlan';

const plan = (config, props) => buildCardPlan(props, config, {});
const bloque = (p, type) => p.blocks.find((b) => b.type === type);

describe('alias de valores', () => {
    const ALIAS = { 0: 'Sin registros', 2024: '2024' };
    const props = { GRAY_INDEX: 0, flotante: '0.0', total: 2024, otro: 1500, cero: 'x' };

    it('reemplaza el valor exacto en renglones y no formatea el alias', () => {
        const p = plan({ list: [
            { field: 'GRAY_INDEX', label: 'A', valueMap: ALIAS },
            { field: 'total', label: 'B', valueMap: ALIAS },
            { field: 'otro', label: 'C', valueMap: ALIAS },
        ] }, props);
        expect(bloque(p, 'list').rows.map((r) => r.value)).toEqual(['Sin registros', '2024', '1,500']);
    });

    it('reconoce el número escrito como decimal', () => {
        const p = plan({ cards: [{ field: 'flotante', label: 'A', valueMap: ALIAS }] }, props);
        expect(bloque(p, 'cards').cards[0].value).toBe('Sin registros');
    });

    it('aplica en etiquetas', () => {
        const p = plan({ labelGroups: [{ fields: [{ field: 'GRAY_INDEX', valueMap: ALIAS }] }] }, props);
        expect(bloque(p, 'labelGroups').groups[0].labels[0].value).toBe('Sin registros');
    });

    it('ignora llaves heredadas del objeto', () => {
        const p = plan({ list: [{ field: 'nombre', label: 'A', valueMap: ALIAS }] }, { nombre: 'constructor' });
        expect(bloque(p, 'list').rows[0].value).toBe('constructor');
    });
});
