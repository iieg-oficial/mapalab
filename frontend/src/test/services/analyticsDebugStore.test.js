import { describe, it, expect, vi } from 'vitest';
import { debugStore } from '@services/analyticsDebugStore';

describe('debugStore', () => {
    it('emit notifica a los suscriptores con una copia del buffer', () => {
        const fn = vi.fn();
        const unsubscribe = debugStore.subscribe(fn);
        debugStore.emit({ id: 1 });
        expect(fn).toHaveBeenCalledTimes(1);
        const received = fn.mock.calls[0][0];
        expect(received).toContainEqual({ id: 1 });
        unsubscribe();
    });

    it('subscribe retorna un unsubscribe que detiene las notificaciones', () => {
        const fn = vi.fn();
        const unsubscribe = debugStore.subscribe(fn);
        unsubscribe();
        debugStore.emit({ id: 2 });
        expect(fn).not.toHaveBeenCalled();
    });

    it('getEvents retorna una copia del buffer interno', () => {
        const before = debugStore.getEvents();
        debugStore.emit({ id: 3 });
        const after = debugStore.getEvents();
        expect(after.length).toBeGreaterThan(before.length);
        after.push({ id: 'mutated' });
        expect(debugStore.getEvents().some(e => e.id === 'mutated')).toBe(false);
    });

    it('limita el buffer a 50 entradas', () => {
        for (let i = 0; i < 60; i += 1) {
            debugStore.emit({ id: `bulk-${i}` });
        }
        expect(debugStore.getEvents().length).toBeLessThanOrEqual(50);
    });
});
