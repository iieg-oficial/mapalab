import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderCard } from '@pages/maps/components/InfoBox/utils/renderCard.jsx';

const card = (properties, config) => render(renderCard(properties, config, null, null, null, null, 'desktop', 1, 1, null));

describe('campos compuestos en la tarjeta', () => {
    it('arma la dirección de varias columnas en un solo renglón', () => {
        card(
            { calle: 'Calz. de los Pirules', numero_ext: 71, colonia: 'Ciudad Granja' },
            {
                list: [{
                    label: 'Dirección',
                    compose: ['calle', { field: 'numero_ext', prefix: '#' }, { field: 'colonia', prefix: 'Col. ' }],
                    sep: ', ',
                }],
            },
        );
        expect(screen.getByText('Calz. de los Pirules, #71, Col. Ciudad Granja')).toBeInTheDocument();
    });

    it('un valor unido no pasa por el formato de números', () => {
        card(
            { calle: '', cp: '45010' },
            { list: [{ label: 'Dirección', compose: ['calle', 'cp'], sep: ', ' }] },
        );
        expect(screen.getByText('45010')).toBeInTheDocument();
    });

    it('la suma sí se formatea como número', () => {
        card(
            { hombres: 8000, mujeres: 4321 },
            { cards: [{ label: 'Población', compose: ['hombres', 'mujeres'], op: 'sum' }] },
        );
        expect(screen.getByText('12,321')).toBeInTheDocument();
    });

    it('el título puede componerse de varias columnas', () => {
        card(
            { nombre: 'Ana', apellido: 'Ruiz' },
            { headerField: { compose: ['nombre', 'apellido'], sep: ' ' } },
        );
        expect(screen.getByText('Ana Ruiz')).toBeInTheDocument();
    });

    it('lee la columna aunque GeoServer la publique en mayúsculas', () => {
        card({ MUNICIPIO: 'Zapopan' }, { list: [{ label: 'Municipio', field: 'municipio' }] });
        expect(screen.getByText('Zapopan')).toBeInTheDocument();
    });
});

describe('columnas multivalor', () => {
    it('parte un renglón de lista por punto y coma', () => {
        card(
            { servicios: 'Agua; Luz; Drenaje' },
            { list: [{ label: 'Servicios', field: 'servicios', split: true }] },
        );
        ['Agua', 'Luz', 'Drenaje'].forEach((v) => expect(screen.getByText(v)).toBeInTheDocument());
    });

    it('no parte un valor que solo trae comas', () => {
        card(
            { ubicacion: 'Zapopan, Jal.' },
            { list: [{ label: 'Ubicación', field: 'ubicacion', split: true }] },
        );
        expect(screen.getByText('Zapopan, Jal.')).toBeInTheDocument();
    });

    it('parte las etiquetas de un labelGroup por punto y coma', () => {
        card(
            { tecnologias: 'React; OpenLayers; FastAPI' },
            { labelGroups: [{ fields: ['tecnologias'], splitValues: true }] },
        );
        ['React', 'OpenLayers', 'FastAPI'].forEach((v) => expect(screen.getByText(v)).toBeInTheDocument());
    });
});
