import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const hijo = (id, extra = {}) => ({ id, wmsConfig: { layerName: 'delitos' }, ...extra });

const ARBOL = [
    {
        id: 'patrimonio',
        isLabel: true,
        children: [
            {
                id: 'robos',
                forceGroup: true,
                children: [
                    hijo('robos_con', { defaultDate: { year: 2024 } }),
                    hijo('robos_sin', { defaultDate: { year: 2024 } }),
                ],
            },
            { id: 'suelta', wmsConfig: { layerName: 'otra' }, defaultDate: { year: 2023 } },
        ],
    },
];

vi.mock('@hooks/useLayers', () => ({ useLayers: () => ({ layers: ARBOL }) }));
vi.mock('@services/analyticsService', () => ({ trackLayerToggle: vi.fn() }));
vi.mock('@services/layerMetadataService', () => ({
    dateColumnOf: () => 'fecha',
    getLayerPeriodicity: vi.fn(async () => ({ 2023: { 1: null }, 2024: { 1: null, 6: null } })),
}));

import { useLayerToggle } from '@hooksMaps/useLayerToggle';
import { getLayerPeriodicity } from '@services/layerMetadataService';

const buscar = (id, nodos = ARBOL) => {
    for (const nodo of nodos) {
        if (nodo.id === id) return nodo;
        const encontrado = nodo.children && buscar(id, nodo.children);
        if (encontrado) return encontrado;
    }
    return null;
};

const hijosDe = (id) => {
    const nodo = buscar(id);
    const ids = [];
    const juntar = (nodos) => nodos.forEach((n) => { ids.push(n.id); if (n.children) juntar(n.children); });
    if (nodo?.children) juntar(nodo.children);
    return ids;
};

const montar = () => {
    const props = {
        setActiveLayerIds: vi.fn(),
        getAllChildLayerIds: hijosDe,
        findLayerById: buscar,
        setSelectedLayer: vi.fn(),
        setSelectedLayerForSymbology: vi.fn(),
        applyFilter: vi.fn(),
        clearFilter: vi.fn(),
        periodicityCache: { getPeriodicity: () => null },
    };
    const { result } = renderHook(() => useLayerToggle(props));
    return { result, ...props };
};

const ANIO_2024 = expect.stringContaining("'2024-01-01'");

beforeEach(() => { vi.clearAllMocks(); });

describe('useLayerToggle - fecha por defecto en grupos', () => {
    it('la fecha de los hijos se aplica al grupo, no a cada hijo', async () => {
        const { result, applyFilter } = montar();
        act(() => result.current.handleToggleLayer('robos', true, true));
        await waitFor(() => expect(applyFilter).toHaveBeenCalledWith('robos', 'date', ANIO_2024));
        expect(applyFilter).toHaveBeenCalledTimes(1);
        expect(getLayerPeriodicity).toHaveBeenCalledTimes(1);
    });

    it('la fecha propia del grupo le gana a la de los hijos', async () => {
        buscar('robos').defaultDate = { year: 2023 };
        const { result, applyFilter } = montar();
        act(() => result.current.handleToggleLayer('robos', true, true));
        await waitFor(() => expect(applyFilter).toHaveBeenCalledWith('robos', 'date', expect.stringContaining("'2023-01-01'")));
        delete buscar('robos').defaultDate;
    });

    it('al apagar el grupo limpia su fecha', () => {
        const { result, clearFilter } = montar();
        act(() => result.current.handleToggleLayer('robos', false, true));
        expect(clearFilter).toHaveBeenCalledWith('robos', 'date');
    });

    it('una capa suelta sigue aplicando su propia fecha', async () => {
        const { result, applyFilter } = montar();
        act(() => result.current.handleToggleLayer('suelta', true, true));
        await waitFor(() => expect(applyFilter).toHaveBeenCalledWith('suelta', 'date', expect.stringContaining("'2023-01-01'")));
    });
});
