import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@components/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@components/Icon', () => ({ default: () => <span /> }));
vi.mock('@hooks/useMaps', () => ({
    useMapsContext: () => ({ measurementConfig: { showSegmentLengths: false }, setMeasurementConfig: vi.fn() }),
}));

import { SiderProvider } from '@contexts/SiderContext';
import MeasurementSettingsButton from '@pages/maps/components/MeasurementTools/MeasurementSettings';

describe('MeasurementSettingsButton', () => {
    it('al presionarlo muestra la configuración junto al botón', () => {
        render(<SiderProvider><MeasurementSettingsButton /></SiderProvider>);
        expect(screen.queryByText('Longitud por segmento')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Configuración de mediciones' }));
        expect(screen.getByText('Longitud por segmento')).toBeInTheDocument();
    });
});
