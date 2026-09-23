import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Polygon from 'ol/geom/Polygon';

vi.mock('@components/Tooltip', () => ({ default: ({ children }) => children }));

import SelectorSeleccion from '@pages/maps/components/MapExport/SelectorSeleccion';
import { SELECCION_TODAS } from '@pages/maps/components/MapExport/utils/seleccionDescarga';

const cuadro = (x) => new Polygon([[[x, 2300000], [x + 3000, 2300000], [x + 3000, 2303000], [x, 2303000], [x, 2300000]]]);
const disponibles = [
    { id: 'a', numero: 1, geometry: cuadro(-11500000) },
    { id: 'b', numero: 2, geometry: cuadro(-11490000) },
];

describe('SelectorSeleccion', () => {
    it('con un solo polígono no se muestra', () => {
        const { container } = render(<SelectorSeleccion disponibles={[disponibles[0]]} elegida="a" onElegir={() => {}} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('lista el más reciente primero, con Todos al final, y avisa la elección', () => {
        const onElegir = vi.fn();
        render(<SelectorSeleccion disponibles={disponibles} elegida="b" onElegir={onElegir} />);
        const opciones = screen.getAllByRole('radio');
        expect(opciones.map(o => o.querySelector('.flex-1').textContent)).toEqual(['Polígono 2', 'Polígono 1', 'Todos (2)']);
        expect(opciones[0]).toHaveAttribute('aria-checked', 'true');
        fireEvent.click(screen.getByText('Todos (2)'));
        expect(onElegir).toHaveBeenCalledWith(SELECCION_TODAS);
    });
});
