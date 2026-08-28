import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActiveLayersToolbar from '@pages/maps/components/ActiveLayers/ActiveLayersToolbar';

const baseProps = {
    noLayers: false,
    unifiedLayers: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
    displayedLayers: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
    isFiltering: false,
    soloSeleccionada: false,
    selectedLayerLabel: 'Temperatura media mensual',
    visibilityCount: 2,
    hasActiveLoops: false,
    activeLoopsCount: 0,
    isInegiMode: false,
    onToggleVisibilityAll: vi.fn(),
    onRemoveAll: vi.fn(),
    onPauseAll: vi.fn(),
    onToggleBaseMode: vi.fn(),
    searchOpen: false,
    searchQuery: '',
    onChangeSearchQuery: vi.fn(),
    onOpenSearch: vi.fn(),
    onCloseSearch: vi.fn(),
    onSearchKeyDown: vi.fn(),
    searchInputRef: { current: null },
};

describe('ActiveLayersToolbar - modo botones', () => {
    it('renderiza el switch IIEG/INEGI y los botones de acción', () => {
        render(<ActiveLayersToolbar {...baseProps} />);
        expect(screen.getByText(/Solo seleccionada/i)).toBeInTheDocument();
        expect(screen.getByText(/Eliminar mis capas/i)).toBeInTheDocument();
    });

    it('abre el buscador al hacer click en el botón buscar', () => {
        const onOpenSearch = vi.fn();
        render(<ActiveLayersToolbar {...baseProps} onOpenSearch={onOpenSearch} />);
        fireEvent.click(screen.getByRole('button', { name: /buscar capas activas/i }));
        expect(onOpenSearch).toHaveBeenCalled();
    });

    it('deshabilita el botón buscar y los de visibilidad/eliminar cuando noLayers', () => {
        const onOpenSearch = vi.fn();
        render(<ActiveLayersToolbar {...baseProps} noLayers onOpenSearch={onOpenSearch} unifiedLayers={[]} displayedLayers={[]} visibilityCount={0} />);
        const btn = screen.getByRole('button', { name: /no hay capas para buscar/i });
        expect(btn).toBeDisabled();
        fireEvent.click(btn);
        expect(onOpenSearch).not.toHaveBeenCalled();
    });

    it('invoca onToggleVisibilityAll al hacer click en el botón de visibilidad', () => {
        const onToggleVisibilityAll = vi.fn();
        render(<ActiveLayersToolbar {...baseProps} onToggleVisibilityAll={onToggleVisibilityAll} />);
        fireEvent.click(screen.getByText(/Solo seleccionada/i));
        expect(onToggleVisibilityAll).toHaveBeenCalled();
    });

    it('nombra la capa aislada cuando el modo está encendido', () => {
        render(<ActiveLayersToolbar {...baseProps} soloSeleccionada />);
        expect(screen.getByText('Temperatura media mensual')).toBeInTheDocument();
        expect(screen.queryByText(/Solo seleccionada/i)).not.toBeInTheDocument();
    });

    it('ofrece aislar la seleccionada cuando se ven varias', () => {
        render(<ActiveLayersToolbar {...baseProps} />);
        expect(screen.getByText(/Solo seleccionada/i)).toBeInTheDocument();
    });

    it('ofrece la salida con el boton de cerrar solo mientras está encendido', () => {
        const salida = /volver a mostrar todas las capas/i;
        const { rerender } = render(<ActiveLayersToolbar {...baseProps} />);
        expect(screen.queryByRole('button', { name: salida })).not.toBeInTheDocument();
        rerender(<ActiveLayersToolbar {...baseProps} soloSeleccionada />);
        expect(screen.getByRole('button', { name: salida })).toBeInTheDocument();
    });

    it('el boton de cerrar apaga el modo', () => {
        const onToggleVisibilityAll = vi.fn();
        render(<ActiveLayersToolbar {...baseProps} soloSeleccionada onToggleVisibilityAll={onToggleVisibilityAll} />);
        fireEvent.click(screen.getByRole('button', { name: /volver a mostrar todas las capas/i }));
        expect(onToggleVisibilityAll).toHaveBeenCalled();
    });

    it('pide elegir una capa y se deshabilita cuando no hay selección', () => {
        const onToggleVisibilityAll = vi.fn();
        render(<ActiveLayersToolbar {...baseProps} selectedLayerLabel={null} onToggleVisibilityAll={onToggleVisibilityAll} />);
        const chip = screen.getByText(/Elige una capa/i).closest('button');
        expect(chip).toBeDisabled();
        fireEvent.click(chip);
        expect(onToggleVisibilityAll).not.toHaveBeenCalled();
    });

    it('se deshabilita también sin capas activas', () => {
        render(<ActiveLayersToolbar {...baseProps} noLayers unifiedLayers={[]} displayedLayers={[]} />);
        expect(screen.getByText(/Elige una capa/i).closest('button')).toBeDisabled();
    });

    it('mantiene visible la etiqueta del chip aunque las demás se oculten', () => {
        render(<ActiveLayersToolbar {...baseProps} />);
        expect(screen.getByText(/Solo seleccionada/i).className).not.toMatch(/\bhidden\b/);
        expect(screen.getByText(/Eliminar mis capas/i).className).toMatch(/\bhidden\b/);
    });

    it('muestra el botón de pausar animaciones cuando hasActiveLoops', () => {
        const onPauseAll = vi.fn();
        render(<ActiveLayersToolbar {...baseProps} hasActiveLoops activeLoopsCount={2} onPauseAll={onPauseAll} />);
        const btn = screen.getByText(/Pausar animaciones/i);
        fireEvent.click(btn);
        expect(onPauseAll).toHaveBeenCalled();
    });

    it('abre el confirm dropdown al click en eliminar y dispara onRemoveAll al confirmar', () => {
        const onRemoveAll = vi.fn();
        render(<ActiveLayersToolbar {...baseProps} onRemoveAll={onRemoveAll} />);
        const eliminarBtn = screen.getByText(/Eliminar mis capas/i);
        fireEvent.mouseEnter(eliminarBtn);
        fireEvent.click(eliminarBtn);
        const confirmBtn = screen.getByText(/Sí. Quiero borrar todas las capas/i);
        fireEvent.click(confirmBtn);
        fireEvent.mouseLeave(eliminarBtn);
        expect(onRemoveAll).toHaveBeenCalled();
    });
});

describe('ActiveLayersToolbar - modo buscador', () => {
    it('renderiza el input al abrirse el buscador', () => {
        render(<ActiveLayersToolbar {...baseProps} searchOpen />);
        expect(screen.getByPlaceholderText(/buscar capas activas/i)).toBeInTheDocument();
    });

    it('propaga el cambio del query al onChangeSearchQuery', () => {
        const onChangeSearchQuery = vi.fn();
        render(<ActiveLayersToolbar {...baseProps} searchOpen onChangeSearchQuery={onChangeSearchQuery} />);
        fireEvent.change(screen.getByPlaceholderText(/buscar capas activas/i), { target: { value: 'lluvia' } });
        expect(onChangeSearchQuery).toHaveBeenCalledWith('lluvia');
    });

    it('muestra cuenta N/Total cuando isFiltering', () => {
        render(<ActiveLayersToolbar
            {...baseProps}
            searchOpen
            isFiltering
            searchQuery="a"
            displayedLayers={[{ id: 'a', name: 'A' }]}
            unifiedLayers={[{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]}
        />);
        expect(screen.getByText('1/2')).toBeInTheDocument();
    });

    it('el mismo botón de buscar cierra el buscador cuando ya está abierto', () => {
        const onCloseSearch = vi.fn();
        render(<ActiveLayersToolbar {...baseProps} searchOpen onCloseSearch={onCloseSearch} />);
        fireEvent.click(screen.getByRole('button', { name: /cerrar buscador/i }));
        expect(onCloseSearch).toHaveBeenCalled();
    });

    it('aria-pressed=true en el botón buscar cuando searchOpen', () => {
        render(<ActiveLayersToolbar {...baseProps} searchOpen />);
        expect(screen.getByRole('button', { name: /cerrar buscador/i })).toHaveAttribute('aria-pressed', 'true');
    });

    it('propaga keyDown del input para escape u otros', () => {
        const onSearchKeyDown = vi.fn();
        render(<ActiveLayersToolbar {...baseProps} searchOpen onSearchKeyDown={onSearchKeyDown} />);
        fireEvent.keyDown(screen.getByPlaceholderText(/buscar capas activas/i), { key: 'Escape' });
        expect(onSearchKeyDown).toHaveBeenCalled();
    });
});
