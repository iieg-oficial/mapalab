import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import Badge from '@components/Badge';
import { useFeatureSeen } from '@hooks/useFeatureSeen';

describe('Badge - visibilidad', () => {
    it('renderiza el count cuando visible y count definido', () => {
        render(<Badge count={5} />);
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('no renderiza cuando visible=false', () => {
        const { container } = render(<Badge count={5} visible={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('no renderiza cuando count es undefined', () => {
        const { container } = render(<Badge visible={true} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('no renderiza cuando count es null', () => {
        const { container } = render(<Badge count={null} visible={true} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renderiza cuando count es 0', () => {
        render(<Badge count={0} />);
        expect(screen.getByText('0')).toBeInTheDocument();
    });
});

describe('Badge - clases', () => {
    it('aplica className extra', () => {
        render(<Badge count={3} className="extra-class" />);
        expect(screen.getByText('3').className).toContain('extra-class');
    });

    it('aplica color default naranja', () => {
        render(<Badge count={1} />);
        const el = screen.getByText('1');
        expect(el.className).toContain('bg-[#FF8300]');
        expect(el.className).toContain('rounded-full');
    });

    it('aplica color purple', () => {
        render(<Badge count={1} color="purple" />);
        expect(screen.getByText('1').className).toContain('bg-[#70308A]');
    });

    it('aplica color pink', () => {
        render(<Badge count={1} color="pink" />);
        expect(screen.getByText('1').className).toContain('bg-[#FF577D]');
    });

    it('cae a naranja si color no es conocido', () => {
        render(<Badge count={1} color="inexistente" />);
        expect(screen.getByText('1').className).toContain('bg-[#FF8300]');
    });

    it('tamaño md por default (size-5)', () => {
        render(<Badge count={1} />);
        expect(screen.getByText('1').className).toContain('size-5');
    });

    it('tamaño sm aplica size-3.5', () => {
        render(<Badge count={1} size="sm" />);
        expect(screen.getByText('1').className).toContain('size-3.5');
    });
});

describe('Badge - featureKey (nueva característica)', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('renderiza cuando hay featureKey sin localStorage y sin count', () => {
        const { container } = render(<Badge featureKey="test-feature" />);
        expect(container.firstChild).not.toBeNull();
    });

    it('renderiza cuando hay featureKey y count', () => {
        render(<Badge featureKey="test-feature" count={7} />);
        expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('no renderiza si ya está marcado como visto en localStorage', () => {
        localStorage.setItem('mapalab:feature-seen:test-feature', 'true');
        const { container } = render(<Badge featureKey="test-feature" count={1} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('al hacer click guarda en localStorage y oculta el badge', () => {
        const { container } = render(<Badge featureKey="test-feature" count={3} />);
        const el = screen.getByText('3');
        fireEvent.click(el);
        expect(localStorage.getItem('mapalab:feature-seen:test-feature')).toBe('true');
        expect(container).toBeEmptyDOMElement();
    });

    it('onClick se invoca junto con markSeen', () => {
        const onClick = vi.fn();
        render(<Badge featureKey="test-feature" count={3} onClick={onClick} />);
        fireEvent.click(screen.getByText('3'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('es clickable solo si hay onClick o featureKey', () => {
        render(<Badge count={1} />);
        expect(screen.getByText('1').className).not.toContain('cursor-pointer');
    });

    it('aplica cursor-pointer cuando hay featureKey', () => {
        render(<Badge count={1} featureKey="x" />);
        expect(screen.getByText('1').className).toContain('cursor-pointer');
    });
});

describe('Badge - variante pill', () => {
    it('renderiza con texto cuando variant="pill"', () => {
        render(<Badge variant="pill" text="1/3" />);
        expect(screen.getByText('1/3')).toBeInTheDocument();
    });

    it('aplica estilos soft (bg + text) en pill', () => {
        render(<Badge variant="pill" text="2/5" color="violet" />);
        const el = screen.getByText('2/5');
        expect(el.className).toContain('bg-[#F4EFF9]');
        expect(el.className).toContain('text-[#5C2472]');
    });

    it('pill no renderiza si text vacío y sin featureKey', () => {
        const { container } = render(<Badge variant="pill" text="" />);
        expect(container).toBeEmptyDOMElement();
    });

    it('pill respeta visible=false', () => {
        const { container } = render(<Badge variant="pill" text="1/3" visible={false} />);
        expect(container).toBeEmptyDOMElement();
    });
});

describe('useFeatureSeen', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('retorna seen=false si no hay valor en localStorage', () => {
        const { result } = renderHook(() => useFeatureSeen('nueva'));
        expect(result.current[0]).toBe(false);
    });

    it('retorna seen=true si ya está en localStorage', () => {
        localStorage.setItem('mapalab:feature-seen:nueva', 'true');
        const { result } = renderHook(() => useFeatureSeen('nueva'));
        expect(result.current[0]).toBe(true);
    });

    it('markSeen persiste en localStorage y actualiza el estado', () => {
        const { result } = renderHook(() => useFeatureSeen('nueva'));
        act(() => result.current[1]());
        expect(result.current[0]).toBe(true);
        expect(localStorage.getItem('mapalab:feature-seen:nueva')).toBe('true');
    });

    it('sin key retorna false y markSeen es no-op', () => {
        const { result } = renderHook(() => useFeatureSeen(null));
        act(() => result.current[1]());
        expect(result.current[0]).toBe(false);
    });
});
