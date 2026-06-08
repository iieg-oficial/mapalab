import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Overlay from 'ol/Overlay';

const TextInlineEditor = ({ mapRef, feature, onChange, onCommit, onCancel }) => {
    const elementRef = useRef(null);
    const inputRef = useRef(null);
    const [draft, setDraft] = useState('');

    if (!elementRef.current && typeof document !== 'undefined') {
        const el = document.createElement('div');
        el.style.pointerEvents = 'auto';
        elementRef.current = el;
    }

    useEffect(() => {
        if (!feature) return;
        setDraft(feature.get('textLabel') || '');
        const id = requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.select?.();
        });
        return () => cancelAnimationFrame(id);
    }, [feature]);

    useEffect(() => {
        const map = mapRef?.current;
        if (!map || !feature || !elementRef.current) return;

        const overlay = new Overlay({
            element: elementRef.current,
            positioning: 'center-center',
            stopEvent: true,
            insertFirst: false
        });
        const geom = feature.getGeometry();
        if (geom) overlay.setPosition(geom.getCoordinates());
        map.addOverlay(overlay);

        const sync = () => {
            const g = feature.getGeometry();
            if (g) overlay.setPosition(g.getCoordinates());
        };
        feature.on('change', sync);
        return () => {
            feature.un('change', sync);
            map.removeOverlay(overlay);
        };
    }, [mapRef, feature]);

    if (!feature || !elementRef.current) return null;

    const handleChange = (value) => {
        setDraft(value);
        onChange?.(value);
    };

    return createPortal(
        <input
            ref={inputRef}
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); onCommit?.(draft); }
                if (e.key === 'Escape') { e.preventDefault(); onCancel?.(); }
            }}
            onBlur={() => onCommit?.(draft)}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Escribe…"
            aria-label="Texto de la anotación"
            className="min-w-[80px] max-w-[60vw] px-2 py-1 text-center rounded-md border-2 border-purple-deep bg-white/95 font-garet font-bold text-[14px] text-graphite shadow-[0_5px_20px_#1A26641A] outline-none"
        />,
        elementRef.current
    );
};

export default TextInlineEditor;
