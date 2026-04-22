import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@components/Icon';

export const MobileSheetCloseButton = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="text-gray-500 hover:text-gray-800 cursor-pointer ml-auto self-start"
        aria-label="Cerrar"
    >
        <Icon name="close" className="size-6" />
    </button>
);

const MobileSheet = ({
    open,
    onClose,
    children,
    excludeRefs = [],
    sheetClassName = '',
    backdropClassName = '',
    maxHeightClass = 'max-h-[85vh]',
    lockBodyScroll = true,
    closeOnEscape = true,
    closeOnClickOutside = true
}) => {
    const sheetRef = useRef(null);

    useEffect(() => {
        if (!open || !closeOnEscape || !onClose) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, closeOnEscape, onClose]);

    useEffect(() => {
        if (!open || !closeOnClickOutside || !onClose) return;
        const handleClickOutside = (event) => {
            const insideSheet = sheetRef.current?.contains(event.target);
            const insideExcluded = excludeRefs.some(ref => ref?.current?.contains(event.target));
            if (!insideSheet && !insideExcluded) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [open, closeOnClickOutside, onClose, excludeRefs]);

    useEffect(() => {
        if (!lockBodyScroll) return;
        if (open) document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [open, lockBodyScroll]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                aria-label="Cerrar"
                className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${backdropClassName}`}
                style={{ opacity: open ? 1 : 0 }}
                onClick={onClose}
            />
            <div
                ref={sheetRef}
                className={`
                    absolute bottom-0 left-0 right-0
                    bg-[#F9FBFF] rounded-t-2xl
                    ${maxHeightClass} flex flex-col overflow-hidden
                    shadow-[0_-5px_20px_#1A26641A]
                    transform transition-transform duration-300 ease-out
                    ${sheetClassName}
                `}
                style={{ transform: open ? 'translateY(0)' : 'translateY(100%)' }}
            >
                {typeof children === 'function' ? children({ close: onClose }) : children}
            </div>
        </div>,
        document.body
    );
};

export default MobileSheet;
