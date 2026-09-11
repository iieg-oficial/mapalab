import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const { enlace } = vi.hoisted(() => ({
    enlace: {
        ensureShare: vi.fn(),
        copyLink: vi.fn(),
        share: null,
        generating: false,
        copied: false,
        error: null,
    },
}));

vi.mock('@pages/maps/hooks/useShareLink', () => ({ useShareLink: () => enlace }));
vi.mock('@components/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@components/Panel', () => ({
    default: ({ open, children }) => (open ? <div data-testid="panel">{children}</div> : null),
}));
vi.mock('@pages/maps/components/SharePanel', () => ({ default: () => <div /> }));

import ShareButton from '@pages/maps/components/ShareButton';

const boton = () => screen.getByRole('button');
const avanzar = (ms) => act(() => { vi.advanceTimersByTime(ms); });

describe('ShareButton', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        enlace.ensureShare.mockClear();
        enlace.copyLink.mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('un paso rapido del mouse no abre el panel ni genera enlace', () => {
        render(<ShareButton />);
        fireEvent.pointerEnter(boton(), { pointerType: 'mouse' });
        avanzar(300);
        fireEvent.pointerLeave(boton(), { pointerType: 'mouse' });
        avanzar(1000);
        expect(screen.queryByTestId('panel')).not.toBeInTheDocument();
        expect(enlace.ensureShare).not.toHaveBeenCalled();
    });

    it('dejar el mouse 400 ms abre el panel y genera el enlace en ese momento', () => {
        render(<ShareButton />);
        fireEvent.pointerEnter(boton(), { pointerType: 'mouse' });
        avanzar(399);
        expect(screen.queryByTestId('panel')).not.toBeInTheDocument();
        avanzar(1);
        expect(screen.getByTestId('panel')).toBeInTheDocument();
        expect(enlace.ensureShare).toHaveBeenCalledTimes(1);
        expect(boton()).toHaveAttribute('aria-expanded', 'true');
    });

    it('en pantallas tactiles el hover no abre nada', () => {
        render(<ShareButton />);
        fireEvent.pointerEnter(boton(), { pointerType: 'touch' });
        avanzar(1000);
        expect(screen.queryByTestId('panel')).not.toBeInTheDocument();
    });

    it('el clic copia el enlace y abre el panel sin esperar', () => {
        render(<ShareButton />);
        fireEvent.click(boton());
        expect(enlace.copyLink).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('panel')).toBeInTheDocument();
    });

    it('un segundo clic cierra el panel abierto con clic', () => {
        render(<ShareButton />);
        fireEvent.click(boton());
        fireEvent.click(boton());
        expect(screen.queryByTestId('panel')).not.toBeInTheDocument();
        expect(enlace.copyLink).toHaveBeenCalledTimes(1);
    });
});
