import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderCard } from '@pages/maps/components/InfoBox/utils/renderCard.jsx';

const card = (properties, config) => render(
    renderCard(properties, config, null, null, null, null, 'desktop', 1, 1, null),
);

const textos = (container) => Array.from(container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6'))
    .filter((el) => el.children.length === 0 && el.textContent.trim())
    .map((el) => el.textContent.trim());

const PROPS = { municipio: 'Zapopan', tipo: 'Primaria', alumnos: 320, turno: 'Matutino' };

describe('varias instancias del mismo bloque', () => {
    it('acepta dos grupos de etiquetas en posiciones distintas', () => {
        const { container } = card(PROPS, {
            labelGroups: [
                { id: 'arriba', items: [{ fields: ['municipio'] }] },
                { id: 'abajo', items: [{ fields: ['tipo'] }] },
            ],
            list: [{ label: 'Turno', field: 'turno' }],
            blockOrder: ['labelGroups:arriba', 'list', 'labelGroups:abajo'],
        });
        const orden = textos(container);
        expect(orden.indexOf('Zapopan')).toBeLessThan(orden.indexOf('Turno:'));
        expect(orden.indexOf('Turno:')).toBeLessThan(orden.indexOf('Primaria'));
    });

    it('acepta dos listas separadas', () => {
        const { container } = card(PROPS, {
            list: [
                { id: 'a', items: [{ label: 'Municipio', field: 'municipio' }] },
                { id: 'b', items: [{ label: 'Turno', field: 'turno' }] },
            ],
        });
        const orden = textos(container);
        expect(orden).toContain('Municipio:');
        expect(orden).toContain('Turno:');
        expect(orden.indexOf('Municipio:')).toBeLessThan(orden.indexOf('Turno:'));
    });

    it('blockOrder decide el orden entre instancias del mismo tipo', () => {
        const { container } = card(PROPS, {
            list: [
                { id: 'a', items: [{ label: 'Municipio', field: 'municipio' }] },
                { id: 'b', items: [{ label: 'Turno', field: 'turno' }] },
            ],
            blockOrder: ['list:b', 'list:a'],
        });
        const orden = textos(container);
        expect(orden.indexOf('Turno:')).toBeLessThan(orden.indexOf('Municipio:'));
    });

    it('la forma de siempre sigue funcionando sin ids', () => {
        const { container } = card(PROPS, {
            headerField: 'tipo',
            labelGroups: [{ fields: ['municipio'] }],
            list: [{ label: 'Turno', field: 'turno' }],
            cards: [{ label: 'Alumnos', field: 'alumnos' }],
        });
        const orden = textos(container);
        ['Primaria', 'Zapopan', 'Turno:', 'Alumnos'].forEach((t) => expect(orden).toContain(t));
    });

    it('una instancia vacía no rompe la tarjeta', () => {
        const { container } = card(PROPS, {
            list: [
                { id: 'a', items: [] },
                { id: 'b', items: [{ label: 'Turno', field: 'turno' }] },
            ],
        });
        expect(textos(container)).toContain('Turno:');
    });

    it('dos bloques de cifras se pintan por separado', () => {
        const { container } = card(PROPS, {
            cards: [
                { id: 'a', items: [{ label: 'Alumnos', field: 'alumnos' }] },
                { id: 'b', items: [{ label: 'Alumnos otra vez', field: 'alumnos' }] },
            ],
        });
        const orden = textos(container);
        expect(orden).toContain('Alumnos');
        expect(orden).toContain('Alumnos otra vez');
    });
});
