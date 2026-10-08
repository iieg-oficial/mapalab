import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import SummaryCard from '@pages/maps/components/InfoBox/components/SummaryCard';

vi.mock('@hooksMaps/useLayerSymbolIcon', () => ({ useLayerSymbolIcon: () => null }));

const resumen = [
    { layerId: 'escuelas', layerName: 'Escuelas', conteo: 1284 },
    { layerId: 'hospitales', layerName: 'Hospitales', conteo: 12 },
];

describe('SummaryCard', () => {
    it('sin elementos cargados usa los conteos del resumen y ofrece ver detalles', () => {
        render(<SummaryCard visible results={[]} resumen={resumen} matched={1296} onToggleExpand={() => {}} />);

        expect(screen.getByText('1,284')).toBeTruthy();
        expect(screen.getByText('12')).toBeTruthy();
        expect(screen.getByText('Ver detalles')).toBeTruthy();
        expect(screen.queryByText(/Se muestran los primeros/)).toBeNull();
    });

    it('sin resumen cuenta los elementos cargados', () => {
        const results = [{ layerId: 'escuelas', layerName: 'Escuelas', features: [{ id: 1 }, { id: 2 }] }];
        render(<SummaryCard visible results={results} matched={2} onToggleExpand={() => {}} />);

        expect(screen.getAllByText('2').length).toBeGreaterThan(0);
        expect(screen.getByText('Ver detalles')).toBeTruthy();
    });
});
