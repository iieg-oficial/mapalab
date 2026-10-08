import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DragHandle, LayerTitle, PinBadge, EventoLayerIcon, GeometryTypeBadge } from '@pages/maps/components/ActiveLayers/LayerItemHeader';

const { mockUseIsNonProd } = vi.hoisted(() => ({
    mockUseIsNonProd: vi.fn(),
}));

vi.mock('@hooks/useDevTools', () => ({
    useIsNonProd: mockUseIsNonProd,
}));

describe('LayerTitle', () => {
    it('renderiza el nombre como texto', () => {
        render(<LayerTitle name="Capa de prueba" />);
        expect(screen.getByText('Capa de prueba')).toBeInTheDocument();
    });

    it('aplica title attr con el nombre', () => {
        render(<LayerTitle name="Capa X" />);
        expect(screen.getByText('Capa X').getAttribute('title')).toBe('Capa X');
    });
});

describe('DragHandle', () => {
    it('no renderiza cuando dragHandleProps es undefined', () => {
        const { container } = render(<DragHandle />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renderiza el botón cuando hay dragHandleProps', () => {
        render(<DragHandle dragHandleProps={{}} />);
        expect(document.querySelector('button')).toBeInTheDocument();
    });

    it('invoca dragHandleProps.onClick y detiene la propagación', () => {
        const onClick = vi.fn();
        render(<DragHandle dragHandleProps={{ onClick }} />);
        fireEvent.click(document.querySelector('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('no rompe si dragHandleProps no trae onClick', () => {
        render(<DragHandle dragHandleProps={{}} />);
        fireEvent.click(document.querySelector('button'));
    });

    it('alterna el estado active con mouseDown/mouseUp/mouseLeave', () => {
        render(<DragHandle dragHandleProps={{}} />);
        const btn = document.querySelector('button');
        fireEvent.mouseDown(btn);
        fireEvent.mouseUp(btn);
        fireEvent.mouseDown(btn);
        fireEvent.mouseLeave(btn);
    });
});

describe('PinBadge', () => {
    it('renderiza un span con el icono hide', () => {
        const { container } = render(<PinBadge />);
        expect(container.querySelector('span')).toBeInTheDocument();
    });
});

describe('GeometryTypeBadge', () => {
    beforeEach(() => {
        mockUseIsNonProd.mockReturnValue(true);
    });

    it('no renderiza nada sin tipo', () => {
        const { container } = render(<GeometryTypeBadge type={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('no renderiza nada con un tipo desconocido', () => {
        const { container } = render(<GeometryTypeBadge type="multipoligono" />);
        expect(container).toBeEmptyDOMElement();
    });

    it.each([
        ['point', 'Capa de puntos'],
        ['line', 'Capa de líneas'],
        ['polygon', 'Capa de polígonos'],
        ['raster', 'Capa ráster']
    ])('renderiza el icono de %s con su etiqueta', (type, label) => {
        render(<GeometryTypeBadge type={type} />);
        expect(screen.getByLabelText(label)).toBeInTheDocument();
    });

    it('renderiza la variante de hexágonos fuera de producción', () => {
        render(<GeometryTypeBadge type="point" hexbin />);
        expect(screen.getByLabelText('Agrupada en hexágonos')).toBeInTheDocument();
    });

    it('renderiza el tipo de capa también en producción', () => {
        mockUseIsNonProd.mockReturnValue(false);
        const { container } = render(<GeometryTypeBadge type="point" />);
        expect(container).not.toBeEmptyDOMElement();
    });

    it('renderiza la variante de hexágonos también en producción', () => {
        mockUseIsNonProd.mockReturnValue(false);
        const { container } = render(<GeometryTypeBadge type="point" hexbin />);
        expect(container).not.toBeEmptyDOMElement();
    });
});

describe('EventoLayerIcon', () => {
    it('no renderiza nada si evento es null', () => {
        const { container } = render(<EventoLayerIcon evento={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('no renderiza nada si evento no tiene iconoUrl', () => {
        const { container } = render(<EventoLayerIcon evento={{ titulo: 'Sin icono' }} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('no renderiza si iconoUrl es cadena vacía', () => {
        const { container } = render(<EventoLayerIcon evento={{ iconoUrl: '', titulo: 'X' }} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renderiza la imagen cuando hay iconoUrl', () => {
        render(<EventoLayerIcon evento={{ iconoUrl: 'https://x.test/icono.png', titulo: 'Evento A' }} />);
        const img = document.querySelector('img');
        expect(img).toBeInTheDocument();
        expect(img.getAttribute('src')).toBe('https://x.test/icono.png');
        expect(img.getAttribute('alt')).toBe('Evento A');
    });

    it('usa alt "evento" como fallback si no hay titulo', () => {
        render(<EventoLayerIcon evento={{ iconoUrl: 'https://x.test/icono.png' }} />);
        expect(document.querySelector('img').getAttribute('alt')).toBe('evento');
    });

    it('aplica loading lazy y decoding async', () => {
        render(<EventoLayerIcon evento={{ iconoUrl: 'https://x.test/icono.png', titulo: 'E' }} />);
        const img = document.querySelector('img');
        expect(img.getAttribute('loading')).toBe('lazy');
        expect(img.getAttribute('decoding')).toBe('async');
    });
});
