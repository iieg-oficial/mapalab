import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createAttributeTable } from '@ghegar/tamiz';

vi.mock('@components/ScrollContainer', () => ({ default: ({ children, className }) => <div className={className}>{children}</div> }));

import MenuColumna from '@pages/maps/components/TablaAtributos/MenuColumna';

const DESCRIBE = {
    featureTypes: [{
        properties: [
            { name: 'nivel', type: 'xsd:string', localType: 'string' },
            { name: 'alumnos', type: 'xsd:int', localType: 'int' },
        ],
    }],
};

const NIVELES = ['Secundaria', 'Primaria', 'Primaria', 'Preescolar'];

const crearTabla = () => {
    const peticiones = [];
    const fetch = async (url) => {
        const params = Object.fromEntries(new URLSearchParams(url.split('?')[1]));
        peticiones.push(params);
        if (params.request === 'DescribeFeatureType') return new Response(JSON.stringify(DESCRIBE));
        const features = NIVELES.map((nivel, i) => ({ type: 'Feature', id: `e.${i}`, properties: { nivel, alumnos: i } }));
        return new Response(JSON.stringify({ type: 'FeatureCollection', features, numberMatched: features.length }));
    };
    const tabla = createAttributeTable({ source: { url: 'https://x/wfs', typeName: 'educacion:escuelas', fetch } });
    return { tabla, peticiones };
};

const esperar = () => act(async () => {
    for (let i = 0; i < 10; i += 1) await new Promise(resolve => setTimeout(resolve, 0));
});

const propiedades = (tabla, onAplicar = vi.fn()) => ({
    columna: 'nivel',
    campos: [{ nombre: 'nivel', tipo: 'texto', valores: ['Primaria'] }],
    municipios: null,
    descriptor: { familia: 'lista', valores: ['Bachillerato'] },
    orden: null,
    onAplicar,
    onLimpiar: vi.fn(),
    onOrdenar: vi.fn(),
    onCerrar: vi.fn(),
    tabla,
});

afterEach(cleanup);

describe('MenuColumna con valores distintos de tamiz', () => {
    it('lista los valores reales de la capa sin perder los ya elegidos', async () => {
        const { tabla, peticiones } = crearTabla();
        tabla.setFilter('alumnos', { kind: 'number', op: 'gte', value: 1 });
        tabla.setFilter('nivel', { kind: 'list', values: ['Bachillerato'] });
        tabla.start();
        await esperar();
        render(<MenuColumna {...propiedades(tabla)} />);
        await esperar();
        const etiquetas = screen.getAllByRole('button').map(boton => boton.textContent).filter(Boolean);
        expect(etiquetas).toEqual(expect.arrayContaining(['Bachillerato', 'Preescolar', 'Primaria', 'Secundaria']));
        const escaneo = peticiones.find(params => params.propertyName === 'nivel');
        expect(escaneo.CQL_FILTER).toBe('alumnos >= 1');
        tabla.destroy();
    });

    it('sin tabla usa los valores del catalogo de campos', () => {
        const onAplicar = vi.fn();
        render(<MenuColumna {...propiedades(null, onAplicar)} />);
        fireEvent.click(screen.getByText('Primaria'));
        expect(onAplicar).toHaveBeenCalledWith({ familia: 'lista', valores: ['Bachillerato', 'Primaria'] });
    });
});
