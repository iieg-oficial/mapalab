import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import MapsContext from '@contexts/MapsContext';
import { useWMSLegend } from '@hooksMaps/useWMSLegend';

const mockLayers = [
    {
        id: 'temperatura_media_mensual',
        label: 'Temperatura media mensual',
        wmsConfig: {
            baseUrl: '/geoserver/raster/wms',
            layerName: 'raster:temperaturas',
            timeEnabled: true,
            timeStylePattern: '',
        },
    },
    {
        id: 'precipitacion_mensual',
        label: 'Precipitación mensual',
        wmsConfig: {
            baseUrl: '/geoserver/raster/wms',
            layerName: 'raster:precipitacion',
            timeEnabled: true,
            timeStylePattern: 'lluvia_total_mensual_{year}_{month}',
        },
    },
    {
        id: 'hospitales',
        label: 'Hospitales',
        wmsConfig: { baseUrl: '/geoserver/salud/wms', layerName: 'salud:hospitales', timeEnabled: false },
    },
];

vi.mock('@hooks/useLayers', () => ({
    useLayers: () => ({ layers: mockLayers, initialOrder: [], loading: false, error: null }),
}));

const FILTROS = {
    temperatura_media_mensual: '2025-03-01',
    precipitacion_mensual: '2025-03-01',
    hospitales: "(fecha >= '2025-01-01' AND fecha < '2026-01-01')",
};

const wrapper = ({ children }) => (
    <MapsContext.Provider value={{
        getFilter: (id) => FILTROS[id] || null,
        getSpecificFilter: (id, nombre) => (nombre === 'date' ? FILTROS[id] || null : null),
    }}>
        {children}
    </MapsContext.Provider>
);

const urlDe = (layer) => {
    const { result } = renderHook(() => useWMSLegend(), { wrapper });
    return result.current.getLegendUrl(layer);
};

describe('useWMSLegend — capas con dimension TIME', () => {
    it('no manda el valor TIME como CQL_FILTER', () => {
        const url = urlDe({ id: 'temperatura_media_mensual' });
        expect(url).toContain('layer=raster:temperaturas');
        expect(url).not.toContain('CQL_FILTER');
        expect(url).not.toContain('2025-03-01');
    });

    it('tampoco activa hideEmptyRules, que solo aplica con filtro', () => {
        expect(urlDe({ id: 'temperatura_media_mensual' })).not.toContain('hideEmptyRules');
    });

    it('sigue resolviendo el STYLE por fecha cuando hay timeStylePattern', () => {
        const url = urlDe({ id: 'precipitacion_mensual' });
        expect(url).toContain('STYLE=lluvia_total_mensual_2025_03');
        expect(url).not.toContain('CQL_FILTER');
    });
});

describe('useWMSLegend — capas vectoriales', () => {
    it('conserva el CQL_FILTER del filtro de fecha', () => {
        const url = urlDe({ id: 'hospitales' });
        expect(url).toContain(`CQL_FILTER=${encodeURIComponent(FILTROS.hospitales)}`);
        expect(url).toContain('hideEmptyRules:true');
    });
});
