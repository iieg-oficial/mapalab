import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('web-vitals', () => ({
    onCLS: vi.fn(),
    onINP: vi.fn(),
    onLCP: vi.fn(),
    onFCP: vi.fn(),
    onTTFB: vi.fn(),
}));

import { useEmbedTelemetry } from '@pages/embed/hooks/useEmbedTelemetry';

const leerCuerpo = (blob) => new Promise((resolve) => {
    const lector = new FileReader();
    lector.onload = () => resolve(JSON.parse(lector.result));
    lector.readAsText(blob);
});

describe('useEmbedTelemetry', () => {
    let beacon;

    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        beacon = vi.fn(() => true);
        Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    });

    afterEach(() => {
        vi.useRealTimers();
        delete navigator.sendBeacon;
    });

    it('markReady manda IFRAME_READY sin esperar otro dato ni el cierre', async () => {
        const { result } = renderHook(() => useEmbedTelemetry({ apiKey: 'mk_pub_abcd1234' }));
        act(() => result.current.markReady());
        expect(beacon).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(1600));
        expect(beacon).toHaveBeenCalledTimes(1);
        const [url, blob] = beacon.mock.calls[0];
        expect(url).toContain('/embed/telemetry?key=mk_pub_abcd1234');
        const cuerpo = await leerCuerpo(blob);
        expect(cuerpo.vitals.map((v) => v.name)).toEqual(['IFRAME_READY']);
    });

    it('markReady solo cuenta una vez', () => {
        const { result } = renderHook(() => useEmbedTelemetry({ apiKey: 'mk_pub_abcd1234' }));
        act(() => {
            result.current.markReady();
            result.current.markReady();
        });
        act(() => vi.advanceTimersByTime(1600));
        act(() => vi.advanceTimersByTime(1600));
        expect(beacon).toHaveBeenCalledTimes(1);
    });
});
