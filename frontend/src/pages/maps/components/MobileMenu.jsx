import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSider } from '@contexts/SiderContext';
import { HIDDEN_SCROLLBAR } from '@constants/global';

const MobileMenu = ({
    open,
    onClose,
    children,
    registerInSider = false,
}) => {
    const menuRef = useRef(null);
    const siderContext = useSider();
    const siderRef = siderContext?.siderRef;

    useEffect(() => {
        if (open && registerInSider && siderContext) {
            siderContext.registerOpenMenu?.();
            return () => {
                siderContext.unregisterOpenMenu?.();
            };
        }
    }, [open, registerInSider, siderContext]);

    useEffect(() => {
        if (!open || !onClose) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    useEffect(() => {
        if (!open || !onClose) return;
        const handleClickOutside = (event) => {
            const isInsideMenu = menuRef.current?.contains(event.target);
            const isInsideSider = siderRef?.current?.contains(event.target);
            if (!isInsideMenu && !isInsideSider) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [open, onClose, siderRef]);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-black/30 transition-opacity duration-300"
                style={{ opacity: open ? 1 : 0 }}
                onClick={onClose}
            />
            <div
                ref={menuRef}
                className={`
                    absolute bottom-0 left-0 right-0
                    bg-[#F9FBFF] rounded-t-2xl
                    max-h-[85vh] overflow-y-auto
                    shadow-[0_-5px_20px_#1A26641A]
                    transform transition-transform duration-300 ease-out
                    ${HIDDEN_SCROLLBAR}
                `}
                style={{
                    transform: open ? 'translateY(0)' : 'translateY(100%)'
                }}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-[#F9FBFF] w-full cursor-pointer"
                    aria-label="Cerrar menú"
                >
                    <div className="w-12 h-1 bg-gray-300 rounded-full" />
                </button>
                {typeof children === 'function' ? children({ close: onClose }) : children}
            </div>
        </div>,
        document.body
    );
};

export default MobileMenu;
