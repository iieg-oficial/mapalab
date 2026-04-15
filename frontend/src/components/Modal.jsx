import { useEffect, useRef, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@components/Icon';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    className = '',
    width = 'max-w-4xl',
    height = 'h-auto',
    showCloseButton = true,
    showHeader = true
}) => {
    const modalRef = useRef(null);
    const titleId = useId();

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const pointerStartRef = useRef(null);

    const handleBackdropPointerDown = useCallback((e) => {
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleBackdropPointerUp = useCallback((e) => {
        if (!pointerStartRef.current) return;
        const dx = Math.abs(e.clientX - pointerStartRef.current.x);
        const dy = Math.abs(e.clientY - pointerStartRef.current.y);
        pointerStartRef.current = null;
        if (dx < 5 && dy < 5) onClose();
    }, [onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onPointerDown={handleBackdropPointerDown}
                onPointerUp={handleBackdropPointerUp}
            />

            <div
                ref={modalRef}
                className={`relative bg-white rounded-2xl shadow-2xl flex flex-col w-full ${width} ${height} ${className} overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {showHeader && (title || showCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-white z-10">
                        {title && (
                            <h3 id={titleId} className="text-lg font-semibold text-gray-900">
                                {title}
                            </h3>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-auto"
                                aria-label="Cerrar modal"
                            >
                                <Icon name="close" className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-400">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
