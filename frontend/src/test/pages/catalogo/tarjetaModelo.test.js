import { describe, it, expect } from 'vitest';
import {
    MAX_FILAS,
    actualizarItem,
    agregarBloque,
    agregarItem,
    configDesdeModelo,
    modeloDesdeConfig,
    moverBloque,
    problemasDe,
    puedeAgregarBloque,
    quitarBloque,
} from '@pages/catalogo/helpers/tarjetaModelo';

const base = {
    headerField: 'Áreas Naturales Protegidas',
    list: [{ field: 'nombre', label: 'Nombre', raw: true, href: 'https://iieg.gob.mx/{nombre}', color: 'rojo' }],
    cards: [{ field: 'area_ha', label: 'Área (ha)', decimals: 0 }],
    text: [{ label: 'Nota de la fuente' }],
    iconText: [{ icon: 'ubicacion', field: 'dir' }],
    blockOrder: ['cards', 'list'],
};

describe('modeloDesdeConfig y configDesdeModelo', () => {
    it('ida y vuelta conserva lo que el esquema admite y descarta lo demás', () => {
        const config = configDesdeModelo(modeloDesdeConfig(base));
        expect(config).toEqual({
            headerField: 'Áreas Naturales Protegidas',
            cards: [{ field: 'area_ha', label: 'Área (ha)', decimals: 0 }],
            list: [{ field: 'nombre', label: 'Nombre', raw: true, href: 'https://iieg.gob.mx/{nombre}' }],
            text: [{ id: 't0', items: [{ label: 'Nota de la fuente' }] }],
            blockOrder: ['cards', 'list', 'text:t0'],
        });
    });

    it('los bloques fijos no entran al modelo', () => {
        expect(modeloDesdeConfig(base).bloques.map((b) => b.key)).toEqual(['cards', 'list', 'text:t0']);
    });

    it('la operación y el separador de una cifra sumada no viajan juntos', () => {
        const modelo = modeloDesdeConfig({ cards: [{ compose: ['a', 'b'], op: 'sum', sep: ' ', label: 'Total' }] });
        expect(configDesdeModelo(modelo).cards[0]).toEqual({ compose: [{ field: 'a' }, { field: 'b' }], op: 'sum', label: 'Total' });
    });

    it('la operación de una fila de detalles no viaja', () => {
        const modelo = modeloDesdeConfig({ list: [{ compose: ['a', 'b'], op: 'join', label: 'AB' }] });
        expect(configDesdeModelo(modelo).list[0]).not.toHaveProperty('op');
    });
});

describe('operaciones', () => {
    it('cifras y detalles son únicos; texto hasta tres', () => {
        let modelo = modeloDesdeConfig(null);
        expect(puedeAgregarBloque(modelo, 'cards')).toBe(true);
        modelo = agregarBloque(modelo, 'cards').modelo;
        expect(puedeAgregarBloque(modelo, 'cards')).toBe(false);
        const llaves = [];
        for (let i = 0; i < 4; i += 1) {
            const r = agregarBloque(modelo, 'text');
            modelo = r.modelo;
            llaves.push(r.key);
        }
        expect(llaves).toEqual(['text:t0', 'text:t1', 'text:t2', null]);
    });

    it('un bloque vacío no se manda y reordenar cambia el blockOrder', () => {
        let modelo = modeloDesdeConfig({ list: [{ field: 'a', label: 'A' }], cards: [{ field: 'c', label: 'C' }] });
        modelo = agregarBloque(modelo, 'text').modelo;
        modelo = moverBloque(modelo, 'cards', 1);
        expect(configDesdeModelo(modelo).blockOrder).toEqual(['list', 'cards']);
        expect(configDesdeModelo(quitarBloque(modelo, 'list')).list).toBeUndefined();
    });

    it('no pasa del máximo de filas', () => {
        let modelo = agregarBloque(modeloDesdeConfig(null), 'list').modelo;
        for (let i = 0; i < MAX_FILAS + 3; i += 1) modelo = agregarItem(modelo, 'list', { field: `f${i}`, label: 'X' });
        expect(modelo.bloques[0].items).toHaveLength(MAX_FILAS);
    });
});

describe('problemasDe', () => {
    it('marca fila sin campo, sin nombre y texto con contacto', () => {
        let modelo = agregarBloque(modeloDesdeConfig(null), 'list').modelo;
        modelo = agregarItem(modelo, 'list', { field: null, label: '' });
        const uid = modelo.bloques[0].items[0].uid;
        expect(problemasDe(modelo).porItem[uid]).toBe('Elige un campo.');
        modelo = actualizarItem(modelo, 'list', uid, { field: 'a' });
        expect(problemasDe(modelo).porItem[uid]).toBe('Ponle nombre.');
        modelo = actualizarItem(modelo, 'list', uid, { label: 'Ve a www.x.com' });
        expect(problemasDe(modelo).porItem[uid]).toBe('Sin links, correos ni teléfonos.');
        modelo = actualizarItem(modelo, 'list', uid, { label: 'Nombre' });
        expect(problemasDe(modelo).hay).toBe(false);
    });

    it('una tarjeta vacía no se puede enviar', () => {
        expect(problemasDe(modeloDesdeConfig(null))).toMatchObject({ vacia: true, hay: true });
    });

    it('un título fijo con contacto se marca', () => {
        expect(problemasDe({ titulo: 'Llama al 3312345678', bloques: [] }).titulo).toBeTruthy();
    });
});
