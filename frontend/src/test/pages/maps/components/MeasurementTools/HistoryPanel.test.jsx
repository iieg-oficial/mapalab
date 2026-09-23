import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@components/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@components/Icon', () => ({ default: ({ name }) => <span data-icono={name} /> }));
vi.mock('@contexts/SiderContext', () => ({ useSiderAdaptivePosition: () => ({ className: '' }) }));
vi.mock('@pages/maps/components/MeasurementTools/MeasurementSettings', () => ({ default: () => null }));

import HistoryPanel from '@pages/maps/components/MeasurementTools/HistoryPanel';

const mediciones = [
    { id: 'a', type: 'Polygon', label: '12.76 km²', visible: true },
    { id: 'b', type: 'LineString', label: '3.2 km', visible: true },
];

describe('HistoryPanel', () => {
    it('borra todo solo después de confirmar', () => {
        const borrarTodo = vi.fn();
        render(<HistoryPanel open measurements={mediciones} onClearAll={borrarTodo} />);

        fireEvent.click(screen.getByRole('button', { name: 'Eliminar todas las mediciones' }));
        expect(borrarTodo).not.toHaveBeenCalled();

        fireEvent.click(screen.getByText('Sí, borrar todo'));
        expect(borrarTodo).toHaveBeenCalledTimes(1);
    });

    it('sin la acción, como en el catálogo, el botón no aparece', () => {
        render(<HistoryPanel open measurements={mediciones} />);
        expect(screen.queryByRole('button', { name: 'Eliminar todas las mediciones' })).toBeNull();
    });
});
