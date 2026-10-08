import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { mapa } = vi.hoisted(() => ({ mapa: { centerOnLayer: vi.fn() } }));

vi.mock('@components/Tooltip', () => ({ default: ({ children, content }) => <div data-tooltip={content}>{children}</div> }));
vi.mock('@components/Icon', () => ({ default: () => <span /> }));
vi.mock('@components/LegendImage', () => ({ default: () => <img alt="leyenda" /> }));
vi.mock('@hooksMaps/useWMSLegend', () => ({ useWMSLegend: () => ({ hasLegend: () => true, getLegendUrl: () => 'https://mapas.test/leyenda.png' }) }));
vi.mock('@pages/maps/components/ActiveLayers/hooks/useLegendsVisibility', () => ({ useLegendsVisibility: () => ({ visible: true }) }));
vi.mock('@hooks/useMaps', () => ({ useMapsContext: () => ({ centerOnLayer: mapa.centerOnLayer, getServiceMode: () => 'wms', getHexbinStats: () => null }) }));
vi.mock('@contexts/SiderContext', () => ({ useSider: () => ({ width: 80, isMobile: false }) }));

import LayerLegendInline from '@pages/maps/components/ActiveLayers/LayerLegendInline';

const capa = { id: 'escuelas', label: 'Escuelas' };

describe('LayerLegendInline', () => {
    beforeEach(() => mapa.centerOnLayer.mockClear());

    it('encuadra la capa con un clic en cualquier parte de la leyenda', () => {
        render(<LayerLegendInline layer={capa} />);
        fireEvent.click(screen.getByAltText('leyenda'));
        expect(mapa.centerOnLayer).toHaveBeenCalledWith('escuelas', expect.objectContaining({ siderWidth: 80, isMobile: false }));
    });

    it('también encuadra con Enter desde el teclado', () => {
        render(<LayerLegendInline layer={capa} />);
        fireEvent.keyDown(screen.getByRole('button', { name: 'Centrar capa en el mapa' }), { key: 'Enter' });
        expect(mapa.centerOnLayer).toHaveBeenCalledTimes(1);
    });

    it('avisa con un tooltip que es la forma de encuadrar', () => {
        const { container } = render(<LayerLegendInline layer={capa} />);
        expect(container.querySelector('[data-tooltip="Encuadrar el mapa en esta capa"]')).not.toBeNull();
    });
});
