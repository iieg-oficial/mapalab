import { describe, it, expect } from 'vitest';
import { fusionarConfig, ordenBase, ordenFusionado, textoConContacto } from '@pages/catalogo/helpers/tarjetaFusion';

describe('fusionarConfig (espejo del backend)', () => {
    it('conserva lo que el editor no toca y deja los bloques fijos en su lugar', () => {
        const base = {
            headerField: 'Titulo viejo',
            list: [{ field: 'a', label: 'A' }],
            text: [{ id: 't0', items: [{ field: 'desc' }] }],
            labelGroups: [{ fields: ['municipio'], color: '#FF8300' }],
            cardsColumns: 2,
            blockOrder: ['labelGroups', 'list', 'text:t0'],
        };
        const propuesta = {
            headerField: 'nombre',
            cards: [{ field: 'pob', label: 'Población' }],
            text: [{ id: 't0', items: [{ field: 'desc' }] }],
            blockOrder: ['cards', 'text:t0'],
        };
        expect(fusionarConfig(base, propuesta)).toEqual({
            headerField: 'nombre',
            cards: [{ field: 'pob', label: 'Población' }],
            text: [{ id: 't0', items: [{ field: 'desc' }] }],
            labelGroups: [{ fields: ['municipio'], color: '#FF8300' }],
            cardsColumns: 2,
            blockOrder: ['labelGroups', 'cards', 'text:t0'],
        });
    });

    it('quitar todo el texto sí se respeta', () => {
        const fusion = fusionarConfig(
            { list: [{ field: 'a', label: 'A' }], text: [{ label: 'Nota' }] },
            { list: [{ field: 'a', label: 'A' }], blockOrder: ['list'] },
        );
        expect(fusion.text).toBeUndefined();
        expect(fusion.blockOrder).toEqual(['list']);
    });

    it('sin blockOrder el orden base sigue el del visor', () => {
        expect(ordenBase({
            cards: [{ field: 'c', label: 'C' }],
            iconText: [{ icon: 'ubicacion', field: 'dir' }],
            list: [{ field: 'a', label: 'A' }],
            text: [{ label: 'Nota' }],
        })).toEqual(['list', 'iconText', 'text:t0', 'cards']);
    });

    it('los bloques fijos quedan en su lugar al reordenar', () => {
        const base = {
            list: [{ field: 'a', label: 'A' }],
            iconText: [{ icon: 'ubicacion', field: 'dir' }],
            cards: [{ field: 'c', label: 'C' }],
        };
        expect(ordenFusionado(base, { blockOrder: ['cards', 'list'] })).toEqual(['cards', 'iconText', 'list']);
    });
});

describe('textoConContacto (espejo del backend)', () => {
    it.each([
        'Visita https://premios.example',
        'www.ofertas.com',
        'Escribe a estafa@correo.com',
        'Llama al 33 1234 5678',
        'Más info en mipagina.mx',
    ])('rechaza %s', (texto) => {
        expect(textoConContacto(texto)).toBe(true);
    });

    it.each([
        'Censo 2020-2025',
        'Área (ha)',
        'Población total 2020',
        'Áreas Naturales Protegidas',
        'Clave INEGI 14039',
    ])('acepta %s', (texto) => {
        expect(textoConContacto(texto)).toBe(false);
    });
});
