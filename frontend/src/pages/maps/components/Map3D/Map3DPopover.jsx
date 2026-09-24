import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const VIEWPORT_MARGIN = 8;
const TRANSFORMS = { centro: 'translateY(-50%)', abajo: 'translateY(-100%)' };

const Map3DPopover = ({ anchorRef, bordeRef = null, onClose, width, alinear = 'centro', className = '', etiqueta, children }) => {
    const ref = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useLayoutEffect(() => {
        const updatePosition = () => {
            const anchor = anchorRef?.current;
            if (!anchor) return;
            const rect = anchor.getBoundingClientRect();
            const borde = (bordeRef?.current || anchor).getBoundingClientRect().right;
            const left = Math.min(window.innerWidth - width - VIEWPORT_MARGIN, borde + 12);
            const top = alinear === 'abajo' ? rect.bottom : rect.top + rect.height / 2;
            setPosition({ top, left: Math.max(VIEWPORT_MARGIN, left) });
        };
        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [anchorRef, bordeRef, width, alinear]);

    useEffect(() => {
        const handleOutside = (event) => {
            if (ref.current?.contains(event.target)) return;
            if (anchorRef?.current?.contains(event.target)) return;
            onClose?.();
        };
        const handleEscape = (event) => {
            if (event.key === 'Escape') onClose?.();
        };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [anchorRef, onClose]);

    return createPortal(
        <div
            ref={ref}
            role="dialog"
            aria-label={etiqueta}
            className={`fixed z-[9999] flex flex-col gap-2 ${className}`}
            style={{ top: position.top, left: position.left, width, transform: TRANSFORMS[alinear] }}
        >
            {children}
        </div>,
        document.body
    );
};

export default Map3DPopover;
