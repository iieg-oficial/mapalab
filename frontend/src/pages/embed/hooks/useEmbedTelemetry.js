import { useEffect, useRef } from 'react';
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';
import { detectParentOrigin } from '@pages/embed/helpers/postMessage';


const FLUSH_DEBOUNCE_MS = 1500;
const MAX_VITALS_PER_FLUSH = 8;
const MAX_ERRORS_PER_FLUSH = 5;


const buildUrl = (key) => {
    const base = (import.meta.env.VITE_BACKEND_API_HOST || '/api/').replace(/\/+$/, '');
    const parent = detectParentOrigin();
    const conPadre = parent ? `&parent=${encodeURIComponent(parent)}` : '';
    return `${base}/embed/telemetry?key=${encodeURIComponent(key)}${conPadre}`;
};


const truncateError = (err) => {
    if (!err) return null;
    const msg = err.message || err.toString();
    const source = err.filename ? `${err.filename}:${err.lineno || ''}` : null;
    return {
        message: String(msg).slice(0, 400),
        source: source ? source.slice(0, 200) : null,
    };
};


export const useEmbedTelemetry = ({ apiKey, enabled = true }) => {
    const buffer = useRef({ vitals: [], errors: [] });
    const flushTimer = useRef(null);
    const sentReady = useRef(false);
    const readyAt = useRef(null);
    const scheduleRef = useRef(null);

    useEffect(() => {
        if (!enabled || !apiKey) return undefined;

        const flush = () => {
            flushTimer.current = null;
            const payload = {
                vitals: buffer.current.vitals.splice(0, MAX_VITALS_PER_FLUSH),
                errors: buffer.current.errors.splice(0, MAX_ERRORS_PER_FLUSH),
            };
            if (!payload.vitals.length && !payload.errors.length) return;
            const url = buildUrl(apiKey);
            try {
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                if (navigator.sendBeacon && navigator.sendBeacon(url, blob)) return;
            } catch { /* fallback fetch */ }
            try {
                fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: 'omit',
                    keepalive: true,
                });
            } catch { /* ignore */ }
        };

        const scheduleFlush = () => {
            if (flushTimer.current) clearTimeout(flushTimer.current);
            flushTimer.current = setTimeout(flush, FLUSH_DEBOUNCE_MS);
        };
        scheduleRef.current = scheduleFlush;
        if (buffer.current.vitals.length) scheduleFlush();

        const recordVital = (metric) => {
            buffer.current.vitals.push({ name: metric.name, value: metric.value });
            scheduleFlush();
        };

        try { onLCP(recordVital); } catch { /* */ }
        try { onCLS(recordVital); } catch { /* */ }
        try { onINP(recordVital); } catch { /* */ }
        try { onFCP(recordVital); } catch { /* */ }
        try { onTTFB(recordVital); } catch { /* */ }

        const onError = (event) => {
            const e = truncateError(event?.error || event);
            if (e) {
                buffer.current.errors.push(e);
                scheduleFlush();
            }
        };
        const onRejection = (event) => {
            const reason = event?.reason;
            const e = truncateError(
                reason instanceof Error
                    ? reason
                    : { message: typeof reason === 'string' ? reason : JSON.stringify(reason || {}) },
            );
            if (e) {
                buffer.current.errors.push(e);
                scheduleFlush();
            }
        };
        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection);

        const onUnload = () => {
            if (flushTimer.current) clearTimeout(flushTimer.current);
            flush();
        };
        window.addEventListener('pagehide', onUnload);
        window.addEventListener('beforeunload', onUnload);

        return () => {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection);
            window.removeEventListener('pagehide', onUnload);
            window.removeEventListener('beforeunload', onUnload);
            scheduleRef.current = null;
            if (flushTimer.current) clearTimeout(flushTimer.current);
            flush();
        };
    }, [enabled, apiKey]);

    const markReady = () => {
        if (sentReady.current) return;
        sentReady.current = true;
        readyAt.current = performance.now();
        try {
            buffer.current.vitals.push({ name: 'IFRAME_READY', value: Math.round(readyAt.current) });
        } catch { /* */ }
        scheduleRef.current?.();
    };

    return { markReady };
};
