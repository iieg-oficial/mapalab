import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { generateCQLFilter } from '@pages/maps/helpers/dateFilterHelpers';

vi.mock('@services/catalogoService', () => ({ fetchCapaPeriodicidad: vi.fn() }));
vi.mock('@services/wmsCapabilitiesService', () => ({ getLayerTimePeriodicity: vi.fn() }));
vi.mock('@utils/featureInfoUtils', () => ({ fetchGeometryType: vi.fn() }));

const { fetchCapaPeriodicidad } = await import('@services/catalogoService');
const { getLayerTimePeriodicity } = await import('@services/wmsCapabilitiesService');
const { fetchGeometryType } = await import('@utils/featureInfoUtils');
const { useCatalogoTiempo } = await import('@pages/catalogo/hooks/useCatalogoTiempo');

const VECTOR = { slug: 'pozos', geoserverWorkspace: 'agua', geoserverLayer: 'pozos' };
const OTRA = { slug: 'escuelas', geoserverWorkspace: 'educacion', geoserverLayer: 'escuelas' };
const RASTER = { slug: 'lluvia-mensual', geoserverWorkspace: 'lluvia', geoserverLayer: 'mensual' };
const PERIODICIDAD = { fecha: { 2025: { 1: [1] }, 2026: { 1: [1], 6: [1] } } };

const montar = (capa, opciones = {}) => renderHook(
    ({ capa: actual }) => useCatalogoTiempo(actual, { current: null }, opciones),
    { initialProps: { capa } },
);

const diferido = () => {
    let resolver;
    const promesa = new Promise((res) => { resolver = res; });
    return { promesa, resolver };
};

beforeEach(() => {
    vi.clearAllMocks();
    fetchCapaPeriodicidad.mockResolvedValue(PERIODICIDAD);
    fetchGeometryType.mockResolvedValue('point');
});

describe('useCatalogoTiempo', () => {
    it('aplica el ?fecha= inicial y no lo borra antes de tener periodicidad', async () => {
        const onFechaChange = vi.fn();
        const { result } = montar(VECTOR, { initialFecha: '2025', onFechaChange });
        expect(onFechaChange).not.toHaveBeenCalled();
        await waitFor(() => expect(result.current.filtro).toBe(generateCQLFilter(new Set(['2025']))));
        expect(onFechaChange).toHaveBeenCalledTimes(1);
        expect(onFechaChange).toHaveBeenCalledWith('2025');
    });

    it('en raster el ?fecha= se mapea al valor TIME y vuelve igual a la URL', async () => {
        getLayerTimePeriodicity.mockResolvedValue({ 2026: { 3: '2026-03-01', 4: '2026-04-01' } });
        const onFechaChange = vi.fn();
        const { result } = montar(RASTER, { initialFecha: '2026-3', onFechaChange });
        await waitFor(() => expect(result.current.filtro).toBe('2026-03-01'));
        expect(onFechaChange).toHaveBeenLastCalledWith('2026-3');
    });

    it('ignora la respuesta de una capa que ya no es la vigente', async () => {
        const vieja = diferido();
        fetchCapaPeriodicidad.mockReturnValueOnce(vieja.promesa);
        const { result, rerender } = montar(VECTOR);
        rerender({ capa: OTRA });
        await waitFor(() => expect(result.current.hasPeriodicidad).toBe(true));
        await act(async () => { vieja.resolver({ fecha: { 1999: { 1: [1] } } }); });
        expect(Object.keys(result.current.periodicidad)).not.toContain('1999');
        expect(result.current.loading).toBe(false);
    });

    it('clearFilter y applyFilter de otra capa no tocan la vigente', async () => {
        const { result } = montar(VECTOR);
        await waitFor(() => expect(result.current.hasPeriodicidad).toBe(true));
        act(() => result.current.applyFilter('pozos', 'date', 'X'));
        expect(result.current.filtro).toBe('X');
        act(() => result.current.clearFilter('escuelas', 'date'));
        act(() => result.current.applyFilter('escuelas', 'date', 'Y'));
        expect(result.current.filtro).toBe('X');
        act(() => result.current.clearFilter());
        expect(result.current.filtro).toBe(null);
    });

    it('el filtro de municipio se suma al de fecha y viaja en los filtros de la capa', async () => {
        const municipio = "municipio IN ('Zapopan')";
        const { result } = montar(VECTOR, { initialFecha: '2025', filtroMunicipio: municipio });
        await waitFor(() => expect(result.current.filtro).toBe(generateCQLFilter(new Set(['2025']))));
        expect(result.current.filtroMapa).toBe(`(${result.current.filtro}) AND (${municipio})`);
        expect(result.current.getLayerFilters().municipio).toBe(municipio);
    });

    it('en raster el municipio no filtra', async () => {
        getLayerTimePeriodicity.mockResolvedValue({ 2026: { 3: '2026-03-01' } });
        const { result } = montar(RASTER, { filtroMunicipio: "municipio IN ('Zapopan')" });
        await waitFor(() => expect(result.current.filtro).toBe('2026-03-01'));
        expect(result.current.filtroMapa).toBeNull();
        expect(result.current.getLayerFilters().municipio).toBeUndefined();
    });
});
