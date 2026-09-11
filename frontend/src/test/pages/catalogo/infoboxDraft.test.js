import { describe, it, expect } from 'vitest';
import {
    addField,
    availableFields,
    draftFromConfig,
    draftHasBlankLabel,
    draftIsEmpty,
    draftToConfig,
    removeField,
    renameField,
    reorderZone,
    MAX_ROWS,
} from '@pages/catalogo/helpers/infoboxDraft';

describe('draftFromConfig', () => {
    it('parte vacío cuando la capa no tiene configuración', () => {
        expect(draftFromConfig(null)).toEqual({ headerField: null, list: [], cards: [] });
        expect(draftIsEmpty(draftFromConfig(null))).toBe(true);
    });

    it('hereda la configuración existente y rellena etiquetas faltantes', () => {
        const draft = draftFromConfig({
            headerField: 'nombre',
            list: [{ field: 'ano_construccion' }, { field: 'municipio', label: 'Municipio' }],
        });
        expect(draft.headerField).toBe('nombre');
        expect(draft.list).toEqual([
            { field: 'ano_construccion', label: 'Ano construccion' },
            { field: 'municipio', label: 'Municipio' },
        ]);
    });

    it('descarta filas sin campo y recorta al máximo', () => {
        const draft = draftFromConfig({
            list: [{ label: 'sin field' }, ...Array.from({ length: 20 }, (_, i) => ({ field: `f${i}` }))],
        });
        expect(draft.list).toHaveLength(MAX_ROWS);
    });

    it('conserva el formato de año hasta la propuesta y descarta otros', () => {
        const draft = draftFromConfig({
            list: [
                { field: 'fecha', label: 'Año', formato: 'anio' },
                { field: 'b', label: 'B', formato: 'mes', raw: true },
            ],
        });
        expect(draft.list).toEqual([
            { field: 'fecha', label: 'Año', formato: 'anio' },
            { field: 'b', label: 'B' },
        ]);
        expect(draftToConfig(draft).list).toEqual(draft.list);
    });
});

describe('edición del borrador', () => {
    it('un campo usado deja de estar disponible', () => {
        let draft = draftFromConfig(null);
        draft = addField(draft, 'list', 'municipio');
        expect(availableFields(['municipio', 'pob'], draft)).toEqual(['pob']);
    });

    it('no permite pasar del máximo de filas', () => {
        let draft = draftFromConfig(null);
        for (let i = 0; i < MAX_ROWS + 5; i += 1) draft = addField(draft, 'list', `f${i}`);
        expect(draft.list).toHaveLength(MAX_ROWS);
    });

    it('el título acepta un solo campo y se reemplaza', () => {
        let draft = addField(draftFromConfig(null), 'header', 'a');
        draft = addField(draft, 'header', 'b');
        expect(draft.headerField).toBe('b');
        expect(removeField(draft, 'header', 'b').headerField).toBeNull();
    });

    it('renombra y reordena', () => {
        let draft = addField(addField(draftFromConfig(null), 'list', 'a'), 'list', 'b');
        draft = renameField(draft, 'list', 'a', 'Alfa');
        expect(draft.list[0].label).toBe('Alfa');
        expect(reorderZone(draft, 'list', 0, 1).list.map((r) => r.field)).toEqual(['b', 'a']);
    });

    it('detecta etiquetas en blanco', () => {
        const draft = renameField(addField(draftFromConfig(null), 'list', 'a'), 'list', 'a', '   ');
        expect(draftHasBlankLabel(draft)).toBe(true);
    });
});

describe('draftToConfig', () => {
    it('produce solo las claves de la allowlist', () => {
        let draft = addField(draftFromConfig(null), 'header', 'nombre');
        draft = addField(draft, 'list', 'municipio');
        draft = addField(draft, 'cards', 'pob');
        expect(Object.keys(draftToConfig(draft)).sort()).toEqual(['blockOrder', 'cards', 'headerField', 'list']);
    });

    it('omite blockOrder cuando hay un solo bloque', () => {
        const draft = addField(draftFromConfig(null), 'list', 'a');
        expect(draftToConfig(draft).blockOrder).toBeUndefined();
    });

    it('pone las cifras antes que los detalles', () => {
        let draft = addField(draftFromConfig(null), 'list', 'a');
        draft = addField(draft, 'cards', 'b');
        expect(draftToConfig(draft).blockOrder).toEqual(['cards', 'list']);
    });
});
